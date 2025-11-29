const model = require('../models/user');

exports.login = (req, res) =>{
    return res.render('./users/login')
}

exports.signup = (req, res) =>{
    return res.render('./users/new')
}

exports.inbox = (req, res) =>{
    return res.render('./users/inbox')
}

exports.loginUser = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password
    
    model.findOne({email: email})
    .then(user =>{
        if(user){
            user.comparePassword(password)
            .then(result =>{
                if(result){
                    if(process.env.NODE_ENV === 'test'){
                        req.session.user = user._id;
                        req.flash('success', 'You have successfully logged in')
                        return res.redirect('/');
                    }
                    req.session.user = user._id;
                    req.flash('success', 'You have successfully logged in')
                    req.session.save(() =>{
                        return res.redirect('/')
                    })
                }
                else{
                    if(process.env.NODE_ENV === 'test'){
                        req.flash('error', 'Wrong Password')
                        return res.redirect('/users/log-in');
                    }
                    req.flash('error', 'Wrong Password')
                    req.session.save(() =>{
                        return res.redirect('/users/log-in')
                    })
                }
            })
            .catch(err => next(err))
        }
        else{
            if(process.env.NODE_ENV === 'test'){
                req.flash('error', 'Wrong Email')
                return res.redirect('/users/log-in');
            }
            req.session.save(() =>{
                req.flash('error', 'Wrong Email')
                return res.redirect('/users/log-in')
            })
        }
    })
    .catch(err => next(err))
};

exports.signupUser = (req, res, next) =>{
    let user = new model(req.body);
    user.save()
    .then(() =>{
        if(process.env.NODE_ENV === 'test'){
            return res.redirect('/users/log-in');
        }
        else{
            req.flash('success', 'You have successfully registered an account')
            req.session.save(() =>{
                return res.redirect('/users/log-in')
            })
        }
    })
    .catch(err =>{
        if(err.code === 11000){
            if(process.env.NODE_ENV === 'test'){
                return res.redirect('/users/sign-up');
            }
            req.session.save(() =>{
                req.flash('error', 'Email must be unique')
                return res.redirect('/users/sign-up')
            })
        }
        else{
            next(err);
        }
    })
};

exports.logOut = (req, res, next) =>{
    req.session.destroy(err =>{
        if(err){
            next(err)
        } else{
            res.redirect('/');
        }
    })
}

// --- Security Question Setup Functions ---

/**
 * Renders the form for a logged-in user to set up their security question.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
exports.getSecuritySetup = (req, res) => {
    // You'd need to create a security.ejs file for this
    res.render('./users/security'); 
};

/**
 * Handles the POST request to save the security question and hashed answer.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.postSecuritySetup = async (req, res, next) => {
    try {
        const { question, answer } = req.body;
        const userId = req.session.user; // Get ID of the currently logged-in user

        // 1. Find the user and update their security fields
        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/profile');
        }

        user.securityQuestion = question;
        user.securityAnswer = answer; // The pre-save hook handles hashing

        await user.save(); 

        req.flash('success', 'Security question successfully saved.');
        res.redirect('/users/profile'); // Redirect back to profile page

    } catch (error) {
        console.error("Error setting up security question:", error);
        req.flash('error', 'Failed to save security question.');
        res.redirect('/users/security-setup');
    }
};

// --- Password Recovery Functions ---

/**
 * Renders the initial 'Forgot Password' form, asking for email.
 */
exports.forgotPassword = (req, res) => {
    // You'll need to create a forgot.ejs file for this
    res.render('./users/forgot'); 
};

/**
 * Handles email submission, looks up the user, and shows the security question.
 */
exports.postForgotEmail = async (req, res, next) => {
    try {
        const email = req.body.email;
        const user = await model.findOne({ email });

        // Ensure user exists AND has all 3 questions set
        if (!user || !user.securityQuestion1 || !user.securityQuestion2 || !user.securityQuestion3) { 
            req.flash('error', 'Email not found or security questions are incomplete.');
            return res.redirect('/users/forgot');
        }

        // ✅ 1. Define the Translation Map
        // This MUST match the 'value' attributes in your <select> tags
        const questionMap = {
            'pet': 'What was the name of your first pet?',
            'city': 'In what city were you born?',
            'mother': "What is your mother's maiden name?",
            'school': 'What was the name of your first school?',
            'car': 'What was the make of your first car?',
            'food': 'What is your favorite food?',
            'hero': 'Who was your childhood hero?',
            'book': 'What is your favorite book?',
            'sport': 'What is your favorite sport?'
        };

        // ✅ 2. Translate the codes to full text
        // We use || user.securityQuestionX as a fallback in case the code isn't found
        const q1Text = questionMap[user.securityQuestion1] || user.securityQuestion1;
        const q2Text = questionMap[user.securityQuestion2] || user.securityQuestion2;
        const q3Text = questionMap[user.securityQuestion3] || user.securityQuestion3;

        // Store info in session
        req.session.recovery = {
            userId: user._id,
            email: user.email
        };

        // ✅ 3. Pass the TRANSLATED text to the view
        res.render('./users/security-check', { 
            questions: [q1Text, q2Text, q3Text],
            email: user.email
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Handles the submission of the security answer and resets the password if correct.
 */
exports.postSecurityAnswer = async (req, res, next) => {
    try {
        // We now expect 3 answers from the form
        const { answer1, answer2, answer3, newPassword } = req.body;
        const recoveryData = req.session.recovery;

        if (!recoveryData) {
            req.flash('error', 'Session expired.');
            return res.redirect('/users/forgot');
        }

        const user = await model.findById(recoveryData.userId);

        // Verify ALL 3 answers concurrently
        const valid1 = await user.compareSecurityAnswer(answer1, 1);
        const valid2 = await user.compareSecurityAnswer(answer2, 2);
        const valid3 = await user.compareSecurityAnswer(answer3, 3);

        if (!valid1 || !valid2 || !valid3) {
            req.flash('error', 'One or more answers were incorrect.');
            return res.redirect('/users/forgot'); // Or re-render security-check
        }
        
        // Success! Reset Password
        user.password = newPassword; 
        await user.save();
        
        req.session.recovery = null;
        req.flash('success', 'Password reset successfully.');
        res.redirect('/users/log-in');

    } catch (error) {
        next(error);
    }
};

/**
 * Renders the user's profile page with their stored details.
 * Requires user to be logged in.
 */
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.session.user;

        // Fetch user data, but exclude the hashed password/answer for security
        const user = await model.findById(userId).select('-password -securityAnswer'); 

        if (!user) {
            req.flash('error', 'User not found or session expired.');
            return res.redirect('/users/log-in');
        }

        // Render the profile view, passing the user object
        res.render('./users/profile', { user: user });

    } catch (error) {
        next(error);
    }
};

/**
 * Handles updates to user details (Name, Email, Security Question/Answer).
 * Requires user to be logged in.
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const body = req.body; // Access all form fields

        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'Update failed: User not found.');
            return res.redirect('/users/log-in');
        }

        // 1. Update Basic Details
        user.name = body.name;
        user.email = body.email;

        // 2. Update Security Questions (Only if answer is provided)
        if (body.securityQuestion1 && body.securityAnswer1) {
            user.securityQuestion1 = body.securityQuestion1;
            user.securityAnswer1 = body.securityAnswer1; 
        }
        if (body.securityQuestion2 && body.securityAnswer2) {
            user.securityQuestion2 = body.securityQuestion2;
            user.securityAnswer2 = body.securityAnswer2; 
        }
        if (body.securityQuestion3 && body.securityAnswer3) {
            user.securityQuestion3 = body.securityQuestion3;
            user.securityAnswer3 = body.securityAnswer3; 
        }
        
        await user.save();

        req.flash('success', 'Profile and security details updated successfully.');
        res.redirect('/users/profile');

    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'Update failed: That email is already in use.');
            return res.redirect('/users/profile');
        }
        next(error);
    }
};
const model = require('../models/user');
const financeData = require('../models/finance-data')
// const Notification = require('../models/notification'); // Assuming you have a Notification model defined and imported

// Define your mock data structure here (outside the function)
const MOCK_ACCOUNTS_DATA = [
    {
        id: 'acc-mock-checking-01',
        name: 'Mock Checking',
        type: 'depository',
        institution: { name: 'Teller Bank Sandbox' },
        balance: { available: 5234.50 }
    },
    {
        id: 'acc-mock-savings-02',
        name: 'Mock Savings Goal',
        type: 'depository',
        institution: { name: 'Teller Bank Sandbox' },
        balance: { available: 18500.00 }
    },
    // Add more mock accounts as needed
];

// --- AUTH / BASIC LOGIC ---

exports.login = (req, res) =>{
    return res.render('./users/login')
}

exports.signup = (req, res) =>{
    return res.render('./users/new')
}

exports.loginUser = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password
    
    model.findOne({email: email})
    .then(user =>{
        if(user){
            // Assumes a comparePassword method on the Mongoose model
            user.comparePassword(password)
            .then(result =>{
                if(result){
                    req.session.user = user._id;
                    req.flash('success', 'You have successfully logged in')
                    req.session.save(() =>{ return res.redirect('/') })
                } else{
                    req.flash('error', 'Wrong Password')
                    req.session.save(() =>{ return res.redirect('/users/log-in') })
                }
            })
            .catch(err => next(err))
        } else{
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
        req.flash('success', 'You have successfully registered an account')
        req.session.save(() =>{ return res.redirect('/users/log-in') })
    })
    .catch(err =>{
        if(err.code === 11000){
            req.session.save(() =>{
                req.flash('error', 'Email must be unique')
                return res.redirect('/users/sign-up')
            })
        } else{
            next(err);
        }
    })
};

exports.logOut = (req, res, next) =>{
    req.session.destroy(err =>{
        if(err){ next(err) } else{ res.redirect('/'); }
    })
}


// --- NOTIFICATION / INBOX LOGIC ---

// NOTE: I am assuming the Notification model is imported or available globally.

exports.inbox = async (req, res, next) => {
    try {
        const userId = req.session.user;
        // Assuming Notification model is available
        const notifications = await Notification.find({ user: userId })
                                               .sort({ createdAt: -1 });
        res.render('users/inbox', { notifications }); 
    } catch (error) {
        next(error);
    }
};

exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/log-in');
        }

        // The user.notifications object is passed directly to the view.
        res.render('./users/profile', {
            user,
            activeTab: 'notifications',
            tabView: './tabs/notifications.ejs',
        });

    } catch (error) {
        next(error);
    }
};

exports.updateNotifications = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'Update failed: User not found.');
            return res.redirect('/users/log-in');
        }
        
        // CRITICAL FIX: Update all fields from the combined form (notifications.ejs)
        user.notifications.enabled = req.body.enabled === 'on';
        user.notifications.thresholdWarning = req.body.threshold === 'on';
        user.notifications.overBudgetAlert = req.body.overbudget === 'on';
        user.notifications.weeklySummary = req.body.weekly === 'on';
        user.notifications.monthlySummary = req.body.monthly === 'on';
        user.notifications.savingsGoalNotifEnabled = req.body.savingsGoalNotif === 'on';
        
        await user.save();

        req.flash('success', 'Notification settings updated successfully.');
        res.redirect('/users/profile/notifications');

    } catch (error) {
        next(error);
    }
};

exports.getInbox = async (req, res, next) => {
    try {
        const userId = req.session.user;
        // Assuming Notification model is available
        const notifications = await Notification.find({ user: userId })
                                               .sort({ createdAt: -1 })
                                               .limit(50);
        res.render('users/inbox', { notifications });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const id = req.params.id;
        // Assuming Notification model is available
        await Notification.findByIdAndUpdate(id, { isRead: true }); 
        res.redirect('/users/inbox');
    } catch (error) {
        next(error);
    }
};

exports.markAllRead = async (req, res, next) => {
    try {
        const userId = req.session.user;
        // Assuming Notification model is available
        await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
        res.redirect('/users/inbox');
    } catch (error) {
        next(error);
    }
};


// --- SECURITY LOGIC (Security Questions / Password Reset) ---

exports.getSecuritySetup = (req, res) => {
    res.render('./users/security'); 
};

exports.postSecuritySetup = async (req, res, next) => {
    try {
        const { question, answer } = req.body;
        const userId = req.session.user; 
        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/profile');
        }

        user.securityQuestion = question;
        user.securityAnswer = answer; 
        await user.save(); 

        req.flash('success', 'Security question successfully saved.');
        res.redirect('/users/profile'); 
    } catch (error) {
        console.error("Error setting up security question:", error);
        req.flash('error', 'Failed to save security question.');
        res.redirect('/users/security-setup');
    }
};

exports.forgotPassword = (req, res) => {
    res.render('./users/forgot'); 
};

exports.postForgotEmail = async (req, res, next) => {
    try {
        const email = req.body.email;
        const user = await model.findOne({ email });

        if (!user || !user.securityQuestion1 || !user.securityQuestion2 || !user.securityQuestion3) { 
            req.flash('error', 'Email not found or security questions are incomplete.');
            return res.redirect('/users/forgot');
        }

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

        const q1Text = questionMap[user.securityQuestion1] || user.securityQuestion1;
        const q2Text = questionMap[user.securityQuestion2] || user.securityQuestion2;
        const q3Text = questionMap[user.securityQuestion3] || user.securityQuestion3;

        req.session.recovery = { userId: user._id, email: user.email };

        res.render('./users/security-check', { 
            questions: [q1Text, q2Text, q3Text],
            email: user.email
        });

    } catch (error) {
        next(error);
    }
};

exports.postSecurityAnswer = async (req, res, next) => {
    try {
        const { answer1, answer2, answer3, newPassword } = req.body;
        const recoveryData = req.session.recovery;

        if (!recoveryData) {
            req.flash('error', 'Session expired.');
            return res.redirect('/users/forgot');
        }

        const user = await model.findById(recoveryData.userId);

        // Assumes compareSecurityAnswer function exists on the Mongoose model
        const valid1 = await user.compareSecurityAnswer(answer1, 1);
        const valid2 = await user.compareSecurityAnswer(answer2, 2);
        const valid3 = await user.compareSecurityAnswer(answer3, 3);

        if (!valid1 || !valid2 || !valid3) {
            req.flash('error', 'One or more answers were incorrect.');
            return res.redirect('/users/forgot'); 
        }
        
        user.password = newPassword; 
        await user.save();
        
        req.session.recovery = null;
        req.flash('success', 'Password reset successfully.');
        res.redirect('/users/log-in');
    } catch (error) {
        next(error);
    }
};

exports.updateTargetSavings = async (req, res) => {
    try {
        const { action, amount, category, index } = req.body;
        let data = await financeData.findOne({ userId: req.session.user });
        if (!data) data = new financeData({ userId: req.session.user });

        if (action === 'add') {
            data.targetSavings.push({
                amount: Number(amount),
                category: category || 'general'
            });
            req.flash('success', 'Target added successfully!');
        } else if (action === 'delete') {
            if (data.targetSavings[index]) {
                data.targetSavings.splice(index, 1);
                req.flash('success', 'Target removed successfully!');
            } else {
                req.flash('error', 'Target not found.');
            }
        }

        await data.save();
        res.redirect('/users/profile');

    } catch (err) {
        req.flash('error', 'Failed to update target savings.');
        res.redirect('/users/profile');
    }
};

// --- PROFILE LOGIC ---

exports.getProfile = async (req, res, next) => {
    console.log("--- DEBUG: Entering getProfile Controller ---");
    try {
        const userId = req.session.user;
        console.log("1. Session User ID:", userId);

        // 1. Fetch User
        const user = await model.findById(userId).select('-password -securityAnswer');
        
        if (!user) {
            console.log("2. Error: User not found in DB.");
            req.flash('error', 'User not found or session expired.');
            return res.redirect('/users/log-in');
        }
        console.log("2. User found:", user.email);

        // 2. Fetch Financial Data
        const data = await financeData.findOne({ userId: req.session.user });
        console.log("3. Financial Data Found:", data ? "YES" : "NO");

        // --- SCENARIO A: NO FINANCIAL DATA YET (New User) ---
        let budgetSummary = {
            status: "ok",
            targetExpenditure: 0,
            totalExpense: 0,
            totalIncome: 0,
            surplusDeficit: 0
        };

        if (!data) {
            console.log("4. No data found. Rendering Empty Profile (Safe Mode).");
        } else {
            // --- SCENARIO B: DATA EXISTS (Existing User) - PROCESS MOCK DATA ---
            console.log("4. Data found. Processing transactions...");

            let recentTransactions = [];
            if (data.transactions && data.transactions.length > 0) {
                recentTransactions = data.transactions.slice(0, 30);
            }

            const normalizedTxns = recentTransactions.map(t => {
                 const rawAmount = parseFloat(t.amount);
                 const incomingTypes = ["credit", "ach_in", "income", "deposit", "interest", "transfer_in", "zelle_in", "refund"];
                 const outgoingTypes = ["card_payment", "ach_out", "debit", "transfer_out", "zelle_out", "fee"];
 
                 let amountNum = rawAmount;
 
                 if (incomingTypes.includes(t.type)) {
                     amountNum = Math.abs(rawAmount);
                 } else if (outgoingTypes.includes(t.type)) {
                     amountNum = -Math.abs(rawAmount);
                 }
 
                 return {
                     id: t.id,
                     date: t.date,
                     description: t.description,
                     category: t.details?.category || "Other",
                     type: t.type,
                     amount: amountNum
                 };
            });

            normalizedTxns.sort((a, b) => new Date(b.date) - new Date(a.date));

            const balanceEntries = (data.balances || []).map(b => ({
                id: `balance_${b.account_id}`,
                date: new Date().toISOString(),
                description: `Balance (${b.account_id.slice(-4)})`,
                category: "Balance",
                type: "balance",
                amount: Number(b.available)
            }));

            const normalizedWithBalance = [...normalizedTxns, ...balanceEntries];

            const totalIncome = normalizedWithBalance
                .filter(t => t.amount > 0)
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpense = normalizedWithBalance
                .filter(t => t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const targetExpenditure = (data.targetSavings || []).reduce((sum, t) => sum + Number(t.amount), 0); 

            budgetSummary = {
                status: targetExpenditure < totalExpense ? "overbudget" : "ok",
                targetExpenditure,
                totalExpense,
                totalIncome,
                surplusDeficit: totalIncome - totalExpense
            };
            console.log("5. Rendering Profile with Data.");
        }


        // RENDER THE PAGE.
        res.render('./users/profile', { 
            user: user, 
            activeTab: 'main',
            tabView: './tabs/main.ejs',
            data,
            budgetSummary,
        });

    } catch (error) {
        console.error("CRITICAL ERROR in getProfile:", error);
        next(error);
    }
};

exports.getSecurity = async (req, res) => {
    const user = await model.findById(req.session.user);
    res.render('./users/profile', {
        user,
        activeTab: 'security',
        tabView: './tabs/securityQuestions'
    });
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const body = req.body; 
        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'Update failed: User not found.');
            return res.redirect('/users/log-in');
        }

        user.name = body.name;
        user.email = body.email;

        if (body.securityQuestion1 && body.securityAnswer1) {
            user.securityQuestion1 = body.securityQuestion1;
            // NOTE: Ideally, security answers should be hashed before saving!
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
        res.redirect('/users/profile/securityQuestions'); // Redirect back to security tab

    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'Update failed: That email is already in use.');
            return res.redirect('/users/profile/securityQuestions');
        }
        next(error);
    }
};


// --- MOCK LINK BANK ACCOUNT LOGIC ---

exports.getLinkBank = async (req, res, next) => {
    try {
        const user = await model.findById(req.session.user);
        let accounts = [];
        let hasBankConnected = false;

        // Check for the mock token saved in the callback
        if (user.tellerEnrollmentId) {
            hasBankConnected = true;

            // MOCK STEP: Return the predefined mock data
            accounts = MOCK_ACCOUNTS_DATA; 
        }

        res.render('./users/profile', {
            user,
            activeTab: 'linkBank', 
            tabView: './tabs/linkBank.ejs',
            accounts, // Passed to the view
            hasBankConnected // Passed to the view
        });

    } catch (error) {
        next(error); 
    }
};

exports.handleTellerCallback = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await model.findById(userId);
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        // MOCK STEP: Simulate a successful token exchange by defining a static mock token.
        const MOCK_ACCESS_TOKEN = 'mock-token-simulating-success-12345';

        // CRITICAL STEP: Save the mock token to the user's profile
        user.tellerEnrollmentId = MOCK_ACCESS_TOKEN; 
        await user.save();

        // Send a success response back to the client-side fetch call, which triggers a page reload.
        res.status(200).json({ status: 'success', message: 'Mock bank connection saved.' });

    } catch (error) {
        console.error("Error during mock Teller callback:", error);
        res.status(500).json({ status: 'error', message: 'Internal server error during mock process.' });
        next(error);
    }
};
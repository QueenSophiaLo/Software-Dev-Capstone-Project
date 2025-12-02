const model = require('../models/user');
<<<<<<< Updated upstream
const financeData = require('../models/finance-data');
// ✅ FIXED: Added missing import for Notifications
const Notification = require('../models/notification');
=======
const financeData = require('../models/finance-data')
const Teller = require('teller'); // Assuming you use a Teller client library


const tellerClient = new Teller.Client({
    applicationId: process.env.TELLER_APP_ID,     
    username: process.env.TELLER_USERNAME,        
    password: process.env.TELLER_PASSWORD,        
    environment: 'sandbox'                        
});
>>>>>>> Stashed changes

exports.login = (req, res) =>{
    return res.render('./users/login')
}

exports.signup = (req, res) =>{
    return res.render('./users/new')
}

// --- NOTIFICATION / INBOX LOGIC ---

exports.inbox = async (req, res, next) => {
    try {
        const userId = req.session.user;
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
        if (!user) return res.redirect('/users/log-in');

        res.render('users/profile', { 
            user: user,
            activeTab: 'notifications',
            tabView: './tabs/notifications'
        });
    } catch (error) {
        next(error);
    }
};

exports.updateNotifications = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const { enabled, threshold, overbudget, weekly, monthly } = req.body;
        const user = await model.findById(userId);
        
        user.notifications = {
            enabled: !!enabled, 
            thresholdWarning: !!threshold,
            overBudgetAlert: !!overbudget,
            weeklySummary: !!weekly,
            monthlySummary: !!monthly
        };

        await user.save();
        req.flash('success', 'Notification preferences updated.');
        res.redirect('/users/profile/notifications');
    } catch (error) {
        next(error);
    }
};

exports.getInbox = async (req, res, next) => {
    try {
        const userId = req.session.user;
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
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.redirect('/users/inbox');
    } catch (error) {
        next(error);
    }
};

exports.markAllRead = async (req, res, next) => {
    try {
        const userId = req.session.user;
        await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
        res.redirect('/users/inbox');
    } catch (error) {
        next(error);
    }
};

// --- AUTH LOGIC ---

exports.loginUser = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password
    
    model.findOne({email: email})
    .then(user =>{
        if(user){
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

// --- SECURITY LOGIC ---

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
<<<<<<< Updated upstream
        const user = await model.findById(userId).select('-password -securityAnswer'); 

=======
        console.log("1. Session User ID:", userId);

        // 1. Fetch User
        const user = await model.findById(userId).select('-password -securityAnswer');
        
>>>>>>> Stashed changes
        if (!user) {
            console.log("2. Error: User not found in DB.");
            req.flash('error', 'User not found or session expired.');
            return res.redirect('/users/log-in');
        }
        console.log("2. User found:", user.email);

<<<<<<< Updated upstream
        // ✅ FIXED: Handle Missing Financial Data Gracefully
        financeData.findOne({ userId: req.session.user })
            .then(data => {
                // DEFAULT EMPTY STATE if no data
                let budgetSummary = null;
                
                if (data) {
                    const recentTransactions = (data.transactions[0] || []).slice(0, 30);
                    
                    const normalizedTxns = recentTransactions.map(t => {
                        const rawAmount = parseFloat(t.amount);
                        const incomingTypes = ["credit", "ach_in", "income", "deposit", "interest", "transfer_in", "zelle_in", "refund"];
                        const outgoingTypes = ["card_payment", "ach_out", "debit", "transfer_out", "zelle_out", "fee"];
                        let amountNum = rawAmount;
                        if (incomingTypes.includes(t.type)) amountNum = Math.abs(rawAmount);
                        else if (outgoingTypes.includes(t.type)) amountNum = -Math.abs(rawAmount);
                        return { amount: amountNum };
                    });
            
                    const totalIncome = normalizedTxns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
                    const totalExpense = normalizedTxns.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    
                    // Check if targetSavings exists
                    const targetExpenditure = data.targetSavings 
                        ? data.targetSavings.reduce((sum, t) => sum + Number(t.amount), 0) 
                        : 0;

                    budgetSummary = {
                        status: targetExpenditure < totalExpense ? "overbudget" : "ok",
                        targetExpenditure,
                        totalExpense,
                        totalIncome,
                        surplusDeficit: targetExpenditure - totalExpense
                    };
                }

                res.render('./users/profile', { 
                    user: user, 
                    activeTab: 'main',
                    tabView: './tabs/main.ejs',
                    data: data || {}, // Pass empty object if null
                    budgetSummary: budgetSummary // Pass null if no data
                });
            })
=======
        // 2. Fetch Financial Data
        const data = await financeData.findOne({ userId: req.session.user });
        console.log("3. Financial Data Found:", data ? "YES" : "NO");

        // --- SCENARIO A: NO FINANCIAL DATA YET (New User) ---
        if (!data) {
            console.log("4. No data found. Rendering Empty Profile (Safe Mode).");
            
            // RENDER THE PAGE. Do NOT redirect.
            return res.render('./users/profile', { 
                user: user, 
                activeTab: 'main',
                tabView: './tabs/main.ejs',
                data: null, 
                budgetSummary: {
                    status: "ok",
                    targetExpenditure: 0,
                    totalExpense: 0,
                    totalIncome: 0,
                    surplusDeficit: 0
                }
            });
        }

        // --- SCENARIO B: DATA EXISTS (Existing User) ---
        console.log("4. Data found. Processing transactions...");

        let recentTransactions = [];
        // Safety check to ensure transactions array exists
        if (data.transactions && data.transactions.length > 0 && Array.isArray(data.transactions[0])) {
            recentTransactions = (data.transactions[0]).slice(0, 30);
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

        const budgetSummary = {
            status: targetExpenditure < totalExpense ? "overbudget" : "ok",
            targetExpenditure,
            totalExpense,
            totalIncome,
            surplusDeficit: targetExpenditure - totalExpense
        };

        console.log("5. Rendering Profile with Data.");
        res.render('./users/profile', { 
            user: user, 
            activeTab: 'main',
            tabView: './tabs/main.ejs',
            data,
            budgetSummary,
        });

>>>>>>> Stashed changes
    } catch (error) {
        console.error("CRITICAL ERROR in getProfile:", error);
        next(error);
    }
};

exports.getSecurity = async (req, res) => {
    const user = await model.findById(req.session.user);
    res.render('./users/profile', {
        user,
<<<<<<< Updated upstream
        activeTab: 'security', // Fixed tab name
=======
        activeTab: 'security',
>>>>>>> Stashed changes
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

/**
 * Renders the notifications settings page.
 */
exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await model.findById(userId); // Assuming model is your user model

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/users/log-in');
        }

        // We will assume the user model has a field called savingsGoalNotifEnabled
        const settings = {
            savingsGoal: user.savingsGoalNotifEnabled || false 
        };

        res.render('./users/profile', {
            user,
            activeTab: 'notifications', // New activeTab key
            tabView: './tabs/notifications.ejs', // New view file
            settings // Pass settings to the view
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Handles saving updates to notification settings.
 */
exports.updateNotifications = async (req, res, next) => {
    try {
        const userId = req.session.user;
        const user = await model.findById(userId);

        if (!user) {
            req.flash('error', 'Update failed: User not found.');
            return res.redirect('/users/log-in');
        }
        
        // The checkbox value will be 'on' if checked, or undefined if unchecked.
        const isEnabled = req.body.savingsGoalNotif === 'on';

        // Update the user document
        user.savingsGoalNotifEnabled = isEnabled;
        await user.save();

        req.flash('success', 'Notification settings updated successfully.');
        res.redirect('/users/profile/notifications');

    } catch (error) {
        next(error);
    }
};

exports.getLinkBank = async (req, res, next) => {
    try {
        const user = await model.findById(req.session.user);
        let accounts = [];
        let hasBankConnected = false;

        // 1. Check if the user has a Teller Enrollment ID stored
        if (user.tellerEnrollmentId) {
            hasBankConnected = true;

            // 2. Fetch Accounts from Teller using the stored ID
            const response = await tellerClient.accounts.list(user.tellerEnrollmentId);
            
            // The Teller API returns an array of accounts (e.g., checking, savings)
            accounts = response.data.accounts; 
            
            // You may also want to fetch balances/transactions here
        }

        res.render('./users/profile', {
            user,
            activeTab: 'linkBank', 
            tabView: './tabs/linkBank.ejs',
            accounts, // Pass the fetched data to the view
            hasBankConnected // A flag to control the view rendering
        });

    } catch (error) {
        // Handle Teller API errors (e.g., enrollment expired)
        req.flash('error', 'Error fetching bank data. Please try re-linking your account.');
        // If the API call fails, clear the enrollment ID
        // user.tellerEnrollmentId = null; 
        // await user.save();
        next(error); 
    }
};
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

// ... (Rest of AUTH LOGIC - loginUser, signupUser, logOut remains the same)

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
            // No need to pass a separate 'settings' object if using user.notifications directly
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
        
        // 🚨 CRITICAL FIX: Update all fields from the combined form (notifications.ejs)
        // Checkboxes return 'on' if checked, or undefined if unchecked.
        
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

// ... (Rest of INBOX LOGIC - getInbox, markAsRead, markAllRead remains the same)

// ... (Rest of SECURITY LOGIC - getSecuritySetup, postSecuritySetup, etc. remains the same)

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
        // Provide a default budgetSummary so the main.ejs view doesn't crash
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
            // Assuming data.transactions is an array of transactions
            if (data.transactions && data.transactions.length > 0) {
                recentTransactions = data.transactions.slice(0, 30);
            }

            // NOTE: The transaction mapping/normalization logic is left as is, assuming it handles mock data structure.

            // The rest of the income/expense calculation logic remains the same.
            const normalizedTxns = recentTransactions.map(t => {
                 // ... (Your existing normalization logic)
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
                surplusDeficit: totalIncome - totalExpense // FIX: Surplus is income minus expense, not target minus expense
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

// ... (Rest of PROFILE LOGIC - getSecurity, updateProfile, updateTargetSavings remains the same)

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
            // This ensures the 'linkBank.ejs' file displays the mock accounts.
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
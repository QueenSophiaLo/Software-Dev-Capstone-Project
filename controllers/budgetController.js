const Resource  = require('../models/resource');
const FinancialData = require('../models/finance-data')

// Dashboard / Home
exports.index = (req, res) => {
  res.render('index');
};

// Add Bank Account Page
exports.budget = (req, res) => {
  res.render('financials/add-bank', { applicationId: process.env.Teller_app_id });
};

// Budget Overview Page
exports.bankaccount = (req, res) => {
    FinancialData.findOne({ userId: req.session.user })
    .then(data => {
        if (!data) {
            req.flash("error", "No financial data found.");
            return res.redirect("/");
        }

        const accounts = data.accounts 
        const balances = data.balances 

        const recentTransactions = (data.transactions[0] || []).slice(0, 30);

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

        const incomeChart = balances.map(bal => {
            const acc = accounts.find(a => a.id === bal.account_id);
            return {
                type: acc?.type,
                amount: Number(bal.available)
            };
        });

        const totalIncome = normalizedWithBalance
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = normalizedWithBalance
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const targetExpense = 1000;

        const budgetSummary = {
            status: targetExpense < totalExpense ? "overbudget" : "ok",
            targetExpenditure: targetExpense,
            totalExpense,
            totalIncome,
            surplusDeficit: totalIncome - totalExpense
        };

        res.render("financials/budget", {
            accounts,
            balances,
            recentTransactions,
            budgetSummary,
            incomeChart
        });
    })
    .catch(err => {
        console.error(err);
        req.flash("error", "Server error retrieving budget data.");
        res.redirect("/");
    });
};


// Show all resources (with search and filter)
// Called by /financials/resources
exports.resources = (req, res, next) => {
    let { category, search } = req.query;
    let filter = {};

    if (category) {
        filter.categories = category;
    }

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    Promise.all([
        Resource.find(filter),
        Resource.distinct('categories')
    ])
    .then(([resources, categories]) => {
        // This renders 'views/resources.ejs'
        res.render('./resources', { 
            resources, 
            categories, 
            selectedCategory: category,
            searchTerm: search 
        });
    })
    .catch(err => next(err));
};

// Show one resource (the viewer screen)
// Called by /financials/resources/:id
exports.resourceDetail = (req, res, next) => {
    let id = req.params.id;

    Resource.findById(id)
    .then(resource => {
        if (resource) {
            // This renders 'views/resource-detail.ejs'
            res.render('./resource-detail', { resource });
        } else {
            let err = new Error('Cannot find a resource with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
};
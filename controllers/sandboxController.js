const Sandbox = require('../models/sandbox')
const model = require('../models/user')

exports.getSandbox = async (req, res, next) =>{
    const userId = await model.findById(req.session.user);

    Sandbox.findOne({userId})
    .then(sandbox =>{
        if(!sandbox){
            sandbox = {
                monthlyIncome: 0,
                expenses: []
            }
        }

        const totalExpenses = sandbox.expenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = sandbox.monthlyIncome - totalExpenses;

        res.render('users/profile', {
            user: userId,
            activeTab: 'sandbox',
            tabView: './tabs/sandbox',
            sandbox,
            totalExpenses,
            remaining
        });
    })
    .catch(err =>{
        req.flash('error', 'Error getting sandbox');
    })
}

exports.handleActions = async (req, res, next) =>{
    const userId = await model.findById(req.session.user);

    const action = req.body.action

    return Sandbox.findOne({userId})
        .then(async sandbox =>{
            if (!sandbox) {
                return Sandbox.create({
                    userId,
                    monthlyIncome: 0,
                    expenses: []
                });
            }
            if (action === 'updateIncome') {
                sandbox.monthlyIncome = Number(req.body.monthlyIncome);
                await sandbox.save();
                return res.redirect("/users/profile/sandbox");
            }

            if (action === 'addExpense') {
                sandbox.expenses.push({
                    description: req.body.description,
                    amount: Number(req.body.amount)
                });
                await sandbox.save();
                return res.redirect("/users/profile/sandbox");
            }

            if (action === 'deleteExpense') {
                const expenseId = req.body.expenseId;
                sandbox.expenses = sandbox.expenses.filter(e => e._id.toString() !== expenseId);
                await sandbox.save();
                return res.redirect("/users/profile/sandbox");
            }
            req.flash('error', 'Error with user action')
            return res.redirect("/users/profile/sandbox");
        })
        .catch(() =>{
            req.flash('error', 'Error with user action')
            return res.redirect("/users/profile/sandbox");
        })
}
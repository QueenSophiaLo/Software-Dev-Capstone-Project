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
        req.flash('error', err.message);
    })
}

exports.handleActions = async (req, res, next) =>{
    const userId = await model.findById(req.session.user);

    const action = req.body.action

    Sandbox.findOne({userId})
    .then(sandbox =>{
        if (!sandbox) {
            return Sandbox.create({
                userId,
                monthlyIncome: 0,
                expenses: []
            });
        }
        return sandbox;
    })
    .then(sandbox =>{
        if (action === 'updateIncome') {
            sandbox.monthlyIncome = Number(req.body.monthlyIncome);
            return sandbox.save();
        }

        if (action === 'addExpense') {
            sandbox.expenses.push({
                description: req.body.description,
                amount: Number(req.body.amount)
            });
            return sandbox.save();
        }

        if (action === 'deleteExpense') {
            const expenseId = req.body.expenseId;
            sandbox.expenses = sandbox.expenses.filter(e => e._id.toString() !== expenseId);
            return sandbox.save();
        }

        return Promise.resolve();
    })
    .then(() =>{
        res.redirect('/users/profile/sandbox')
    })
    .catch(err =>{
        req.flash('error', err.message)
    })
}
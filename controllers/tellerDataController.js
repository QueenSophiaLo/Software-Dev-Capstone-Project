const FinancialData = require('../models/finance-data');
const model = require('../models/user');

async function fetchAccounts(accessToken) {
    const res = await fetch('https://api.teller.io/accounts', { 
        headers: { 
            Authorization: 'Basic ' + Buffer.from(`${accessToken}:`).toString('base64')
        }
    });
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
}

async function fetchTransactions(accountId, accessToken) {
    const res = await fetch(`https://api.teller.io/accounts/${accountId}/transactions`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accessToken}:`).toString('base64')
      }
    });
  
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Failed to fetch transactions');
    }
  
    return res.json();
  }

async function fetchBalances(accountId, accessToken) {
    const res = await fetch(`https://api.teller.io/accounts/${accountId}/balances`, {
        headers: {
        Authorization: 'Basic ' + Buffer.from(`${accessToken}:`).toString('base64')
        }
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to fetch balances');
    }

    return res.json();
}

exports.handleCallBack = async (req, res) => {
    const { access_token } = req.body;
    try{
        const accountsData = await fetchAccounts(access_token);
        const bals = []
        const transacts = []

        const userAccounts = await Promise.all(accountsData.map(async account => {
            const balance = await fetchBalances(account.id, access_token);
            bals.push(balance)
            const transaction = await fetchTransactions(account.id, access_token);
            transacts.push(transaction)
            return account;
        }));
        const finData = new FinancialData({
            userId: req.session.user,
            access_token,
            accounts: userAccounts,
            balances: bals,
            transactions: transacts,
            notes: "", 
            lastUpdated: new Date()
        })

        await finData.save()

        const totalBalance = bals.reduce((sum, b) => sum + Number(b.available), 0);

        await model.findByIdAndUpdate(req.session.user, { money: totalBalance });

        req.flash('success', 'Successfully saved finance data')
        res.redirect('/financials/budget'); 
    }
    catch(err) {
        req.flash('error', err.message);
        res.redirect('/'); 
    }
};
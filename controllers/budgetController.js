// Dashboard / Home
exports.index = (req, res) => {
  res.render('index');
};

// Add Bank Account Page
exports.budget = (req, res) => {
  res.render('financials/add-bank');
};

// Budget Overview Page
exports.bankaccount = (req, res) => {
  res.render('financials/budget');
};
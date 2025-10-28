// Income Chart
const incomeCtx = document.getElementById('incomeChart');
if (incomeCtx) {
  new Chart(incomeCtx, {
    type: 'pie',
    data: {
      labels: ['Misc. Income', 'Account Transfer', 'Wages/Salary'],
      datasets: [{
        data: [1319.02, 1100.00, 180.00],
        backgroundColor: ['#7ed957', '#6bc96b', '#459c45']
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Expense Chart
const expenseCtx = document.getElementById('expenseChart');
if (expenseCtx) {
  new Chart(expenseCtx, {
    type: 'pie',
    data: {
      labels: ['Home', 'Food/Drink', 'Education', 'Shopping', 'Subscriptions'],
      datasets: [{
        data: [3898.24, 634.59, 839.11, 384.12, 99.54],
        backgroundColor: ['#d45a5a', '#e88c6a', '#f0b76a', '#f4d36a', '#f7eb8a']
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// Transactions table
const transactions = [
  { date: '9/3/2025', desc: 'Paycheck', amount: 281.83, category: 'Wages' },
  { date: '9/3/2025', desc: 'Spotify', amount: 10.73, category: 'Subscriptions' },
  { date: '9/7/2025', desc: 'Black Powder BBQ', amount: 41.74, category: 'Dining' },
  { date: '9/10/2025', desc: 'Zelle from Elizabeth', amount: 19.00, category: 'Misc. Income' }
];

const tableBody = document.getElementById('transactionTable');
if (tableBody) {
  transactions.forEach(t => {
    const row = `<tr>
      <td>${t.date}</td>
      <td>${t.desc}</td>
      <td>$${t.amount.toFixed(2)}</td>
      <td>${t.category}</td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

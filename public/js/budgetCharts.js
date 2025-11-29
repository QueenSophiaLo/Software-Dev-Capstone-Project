// -------- Income Chart --------
if (typeof incomeLabels !== "undefined" && typeof incomeValues !== "undefined") {
  const incomeCtx = document.getElementById('incomeChart');
  if (incomeCtx) {
    new Chart(incomeCtx, {
      type: 'pie',
      data: {
        labels: incomeLabels,
        datasets: [{
          data: incomeValues,
          backgroundColor: ['#4CAF50', '#8BC34A', '#CDDC39']
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

// -------- Expense Chart --------
if (typeof expenseByCategory !== "undefined") {
  const expenseCtx = document.getElementById('expenseChart');
  if (expenseCtx) {
    new Chart(expenseCtx, {
      type: 'pie',
      data: {
        labels: Object.keys(expenseByCategory),
        datasets: [{
          data: Object.values(expenseByCategory),
          backgroundColor: [
            "#d45a5a", "#e88c6a", "#f0b76a", "#f4d36a", "#f7eb8a",
            "#d97b7b", "#c45555"
          ]
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
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

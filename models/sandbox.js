const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: String,
    amount: Number
});

const sandboxSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    monthlyIncome: { type: Number, default: 0 },
    expenses: [expenseSchema]
});

module.exports = mongoose.model('Sandbox', sandboxSchema);

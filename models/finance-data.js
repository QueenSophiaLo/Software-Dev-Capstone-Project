const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    date: {type: String},
    description: {type: String},
    amount: {type: Number},
    type: {type: String}
})

const accountSchema = new Schema({
    tellerAccId: {type: String},
    name: {type: String},
    type: {type: String},
    balance: {type: Number},
    currency: {type: String},
    routingNumber: {type: String},
    accountNumber: {type: String},
    transactions: [transactionSchema],
})

const financeDataSchema = new Schema ({
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    accounts: [accountSchema]
}) 


module.exports = mongoose.model('FinanceData', financeDataSchema);
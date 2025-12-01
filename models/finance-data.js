const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const financeData = new Schema ({
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    access_token: {type: String, require: true},
    accounts: {type: Array, default: []},
    balances: {type: Array, default: []},
    transactions: {type: Array, default: []},
    notes: {type: String, default: ""},
    lastUpdated: { type: Date, default: Date.now}
}) 


module.exports = mongoose.model('finance-data', financeData);
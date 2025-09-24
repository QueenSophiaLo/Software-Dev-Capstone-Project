const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const financeData = new Schema ({
    userId: {type: Schema.Types.ObjectId, ref: 'User'},
    category: {type: String, required: [true, 'Category is required'], 
        enum: ['Food', 'Rent', 'Transportation', 'Entertainment', 'Other']},
    amount: {type: Number, required: [true, 'Amount is required'], min: [0.01, 'minimum price is 0.01'], },
    date: {type: String, date: new Date(), required: [true, 'Date is required']},
    description: {type: String, required: [true, 'Description is required']}
}) 


module.exports = mongoose.model('Finance-data', financeData);
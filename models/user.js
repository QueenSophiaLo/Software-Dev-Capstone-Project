const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypty = require('bcryptjs')

const userSchema = new Schema({
    name: {type: String, required: [true, 'Name is required']} ,
    email: {type: String, required: [true, 'Email is required'], unique: true},
    password: {type: String, required: [true, 'Password is required']},
})

userSchema.pre('save', function(next){
    let user = this;
    if(!user.isModified('password')){
        return next;
    }
    bcrypty.hash(user.password, 10)
    .then(hash =>{
        user.password = hash
        next();
    })
    .catch(err => next(err))
})

userSchema.methods.comparePassword = function(loginPassword){
    return bcrypty.compare(loginPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);
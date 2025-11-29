const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    name: { type: String, required: [true, 'Name is required'] },
    email: { type: String, required: [true, 'Email is required'], unique: true },
    password: { type: String, required: [true, 'Password is required'] },
    money: { type: Number, default: 0.00 },
    
    // Three sets of security questions
    securityQuestion1: { type: String, trim: true },
    securityAnswer1: { type: String, trim: true },
    
    securityQuestion2: { type: String, trim: true },
    securityAnswer2: { type: String, trim: true },

    securityQuestion3: { type: String, trim: true },
    securityAnswer3: { type: String, trim: true }
});

userSchema.pre('save', function(next) {
    let user = this;

    // Hash Password if modified
    if (user.isModified('password')) {
        user.password = bcrypt.hashSync(user.password, 10);
    }

    // Hash ALL 3 Security Answers if modified
    if (user.isModified('securityAnswer1') && user.securityAnswer1) {
        user.securityAnswer1 = bcrypt.hashSync(user.securityAnswer1, 10);
    }
    if (user.isModified('securityAnswer2') && user.securityAnswer2) {
        user.securityAnswer2 = bcrypt.hashSync(user.securityAnswer2, 10);
    }
    if (user.isModified('securityAnswer3') && user.securityAnswer3) {
        user.securityAnswer3 = bcrypt.hashSync(user.securityAnswer3, 10);
    }

    next();
});

userSchema.methods.comparePassword = function(loginPassword) {
    return bcrypt.compare(loginPassword, this.password);
};

// Helper to compare a specific answer (1, 2, or 3)
userSchema.methods.compareSecurityAnswer = function(submittedAnswer, questionNumber) {
    const storedHash = this[`securityAnswer${questionNumber}`];
    if (!storedHash) return false;
    return bcrypt.compare(submittedAnswer, storedHash);
};

module.exports = mongoose.model('User', userSchema);
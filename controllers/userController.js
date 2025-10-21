const model = require('../models/user');

exports.login = (req, res, next)=>{
    res.render('./users/login');
};

exports.signup = (req, res, next) =>{
    res.render('./users/new');
};
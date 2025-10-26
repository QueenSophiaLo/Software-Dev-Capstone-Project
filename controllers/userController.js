const model = require('../models/user');

exports.login = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password
    
    model.findOne({email: email})
    .then(user =>{
        if(user){
            user.comparePassword(password)
            .then(result =>{
            })
        }
    })
};

exports.signup = (req, res, next) =>{
    let user = new model(req.body);
    user.save()
    .then(user =>{
        req.session.save(() =>{
            res.redirect('/users/login')
        })
    })
    .catch(err =>{
        if(err.code === 11000){
            req.session.save(() =>{
                err.message("Error in sign up")
                return res.redirect('./users/new')
            })
        }
        else{
            next(err);
        }
    })
};
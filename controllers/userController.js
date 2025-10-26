const model = require('../models/user');

exports.login = (req, res, next)=>{
    let email = req.body.email;
    let password = req.body.password
    
    model.findOne({email: email})
    .then(user =>{
        if(user){
            user.comparePassword(password)
            .then(result =>{
                if(result){
                    req.session.user = user._id;
                    req.session.save(() =>{
                        res.redirect('/users/profile')
                    })
                }
                else{
                    console.log("wrong password")
                    req.session.save(() =>{
                        res.redirect('/users/login')
                    })
                }
            })
            .catch()
        }
        else{
            console.log("wrong email")
            req.session.save(() =>{
                res.redirect('/users/login')
            })
        }
    })
    .catch(err => next(err))
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
const model = require('../models/user');

exports.login = (req, res) =>{
    return res.render('./users/login')
}

exports.signup = (req, res) =>{
    return res.render('./users/new')
}

exports.loginUser = (req, res, next)=>{
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
                        console.log("login sucess")
                    })
                }
                else{
                    console.log("wrong password")
                    req.session.save(() =>{
                        res.redirect('/users/log-in')
                    })
                }
            })
            .catch()
        }
        else{
            console.log("wrong email")
            req.session.save(() =>{
                res.redirect('/users/log-in')
            })
        }
    })
    .catch(err => next(err))
};

exports.signupUser = (req, res, next) =>{
    const {name, email, password} = req.body;

    let user = new model({name, email, password});

    if(req.body.confirmpassword === req.body.password){
        user.save()
        .then(user =>{
            req.session.save(() =>{
                res.redirect('/users/log-in')
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
    }
    else{
        console.log("Incorrect Passwords dont match")
    }
    
};
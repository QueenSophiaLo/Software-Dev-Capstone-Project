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
                    req.flash('success', 'You have successfully logged in')
                    req.session.save(() =>{
                        res.redirect('/')
                    })
                }
                else{
                    req.flash('error', 'Wrong Password')
                    req.session.save(() =>{
                        res.redirect('/users/log-in')
                    })
                }
            })
            .catch()
        }
        else{
            req.flash('error', 'Wrong Email')
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

    if(req.body.confirmpassword !== req.body.password){
        req.flash('error', 'Passwords do not match')
        if(process.env.NODE_ENV === 'test'){
            return res.redirect('/users/sign-up')
        }
        return req.session.save(() =>{
            res.redirect(req.get('referer'))
        })
    }
    user.save()
    .then(() =>{
        if(process.env.NODE_ENV === 'test'){
            return res.redirect('/users/log-in');
        }
        else{
            req.flash('success', 'You have successfully registered an account')
            req.session.save(() =>{
                res.redirect('/users/log-in')
            })
        }
    })
    .catch(err =>{
        if(err.code === 11000){
            if(process.env.NODE_ENV === 'test'){
                return res.redirect('/users/new');
            }
            req.session.save(() =>{
                req.flash('error', 'Email must be unique')
                return res.redirect('./users/new')
            })
        }
        else{
            next(err);
        }
    })
};
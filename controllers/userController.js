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
                    if(process.env.NODE_ENV === 'test'){
                        req.session.user = user._id;
                        req.flash('success', 'You have successfully logged in')
                        return res.redirect('/');
                    }
                    req.session.user = user._id;
                    req.flash('success', 'You have successfully logged in')
                    req.session.save(() =>{
                        res.redirect('/')
                    })
                }
                else{
                    if(process.env.NODE_ENV === 'test'){
                        req.flash('error', 'Wrong Password')
                        res.redirect('/users/log-in');
                    }
                    req.flash('error', 'Wrong Password')
                    req.session.save(() =>{
                        res.redirect('/users/log-in')
                    })
                }
            })
            .catch()
        }
        else{
            if(process.env.NODE_ENV === 'test'){
                req.flash('error', 'Wrong Email')
                res.redirect('/users/log-in');
            }
            req.session.save(() =>{
                res.redirect('/users/log-in')
            })
        }
    })
    .catch(err => next(err))
};

exports.signupUser = (req, res, next) =>{
    let user = new model(req.body);
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
                return res.redirect('/users/sign-up');
            }
            req.session.save(() =>{
                req.flash('error', 'Email must be unique')
                return res.redirect('/users/sign-up')
            })
        }
        else{
            next(err);
        }
    })
};
//checks if user is a guest
exports.isGuest = (req, res, next) =>{
    if(!req.session.user){
        return next();
    }
    else{
        req.flash('error', 'You are logged in already')
        return res.redirect('/users/profile');
    }
};

//check if user is auth
exports.isLoggedIn = (req, res, next) =>{
    if(req.session.user){
        return next();
    }
    else{
        req.flash('error', 'You need to log in first')
        return res.redirect('/users/login');
    }
};
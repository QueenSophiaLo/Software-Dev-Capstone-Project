const {body} = require('express-validator');
const {validationResult} = require('express-validator');

exports.validatorSignUp = [body('name', 'Name cannot be empty').notEmpty().trim().escape(),
    body('email', 'Email cannot be empty').notEmpty().bail().isEmail().withMessage('Email must be valid email address').trim().escape().normalizeEmail(),
    body('password', 'Password cannot be empty').notEmpty().bail().isLength({min: 8, max: 64}).withMessage('Password must be atleast 8 characters and at most 64 characters'),
    body('confirmpassword').notEmpty().withMessage('Confirm Password cannot be empty').bail().isLength({min: 8, max: 64}).withMessage('Confirm Password must be atleast 8 characters and at most 64 characters').custom((value, { req }) => {
        if (req.body.password && value !== req.body.password) {
            throw new Error('Passwords do not match');
            }
            return true;
        })
];

exports.validateLogin = [body('email', 'Email cannot be empty').notEmpty().bail().isEmail().withMessage('Email must be valid email address').trim().escape().normalizeEmail(),
    body('password', 'Password cannot be empty').notEmpty().bail().isLength({min: 8, max: 64}).withMessage('Password must be atleast 8 characters and at most 64 characters')];

exports.validateResults = (req, res, next) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        errors.array().forEach(error=>{
            req.flash('error', error.msg);
        })
        return res.redirect(req.get('referer'))
    }else{
        return next();
    }
}
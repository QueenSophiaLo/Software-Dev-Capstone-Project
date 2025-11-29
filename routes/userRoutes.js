const express = require('express');
const controller = require('../controllers/userController');
const valid = require('../middleware/validator')
const auth = require('../middleware/auth')
const router = express.Router();

//GET /sign-up: send sign-up page to client
router.get('/sign-up', controller.signup);

//POST /users: create a new user
router.post('/sign-up', valid.validatorSignUp, valid.validateResults, controller.signupUser)

//GET /login: send login page to client
router.get('/log-in', controller.login);

//POST /login: start new user session
router.post('/log-in', valid.validateLogin, valid.validateResults, controller.loginUser);

// GET /users/profile: Render the user's profile page
router.get('/profile', auth.isLoggedIn, controller.getProfile);

// POST /users/profile: Handle updates to user details and security questions
router.post('/profile', auth.isLoggedIn, controller.updateProfile);

//GET /logout: logout current user session
router.get('/logout', auth.isLoggedIn, controller.logOut);

// GET /users/security-setup: Render the setup form
router.get('/security-setup', auth.isLoggedIn, controller.getSecuritySetup);

// POST /users/security-setup: Handle saving the question and answer
router.post('/security-setup', auth.isLoggedIn, controller.postSecuritySetup);

// --- Security Question Setup Routes (Requires Login) ---
router.get('/security-setup', auth.isLoggedIn, controller.getSecuritySetup);

router.post('/security-setup', auth.isLoggedIn, controller.postSecuritySetup);

// --- Password Recovery Routes (Does NOT Require Login) ---

// 1. GET /users/forgot: Renders form asking for email
router.get('/forgot', controller.forgotPassword);

// 2. POST /users/forgot-email: Handles email, finds user, shows security question (security-check.ejs)
router.post('/forgot-email', controller.postForgotEmail);

// 3. POST /users/reset: Handles security answer and new password submission
router.post('/reset', controller.postSecurityAnswer);

module.exports = router;
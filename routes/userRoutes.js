const express = require('express');
const controller = require('../controllers/userController');
const sandboxController = require('../controllers/sandboxController')
const valid = require('../middleware/validator')
const auth = require('../middleware/auth')
const router = express.Router();

// --- AUTHENTICATION ROUTES (Login, Signup, Logout) ---

// GET /sign-up: send sign-up page to client
router.get('/sign-up', controller.signup);

// POST /sign-up: create a new user
router.post('/sign-up', valid.validatorSignUp, valid.validateResults, controller.signupUser);

// GET /log-in: send login page to client
router.get('/log-in', controller.login);

// POST /log-in: start new user session
router.post('/log-in', valid.validateLogin, valid.validateResults, controller.loginUser);

// GET /logout: logout current user session
router.get('/logout', auth.isLoggedIn, controller.logOut);

// --- MAIN PROFILE ROUTES ---

// GET /users/profile: Render the user's main profile/dashboard tab
router.get('/profile', auth.isLoggedIn, controller.getProfile);

// POST /users/profile: Handle adding/deleting savings targets (via the main profile tab)
router.post('/profile', auth.isLoggedIn, controller.updateTargetSavings);

// --- PROFILE SUB-TAB ROUTES ---

// GET /users/profile/linkBank: Render the Link Bank Account tab
router.get('/profile/linkBank', auth.isLoggedIn, controller.getLinkBank); 

// POST /users/profile/linkBank/callback: Handle the Teller Link success callback
router.post('/profile/linkBank/callback', auth.isLoggedIn, controller.handleTellerCallback); 

// GET /users/profile/notifications: Render the notifications settings tab
router.get('/profile/notifications', auth.isLoggedIn, controller.getNotifications);

// POST /users/profile/notifications: Handle saving notification settings
router.post('/profile/notifications', auth.isLoggedIn, controller.updateNotifications);

// GET /users/profile/securityQuestions: Render the profile settings tab (user info, email, etc.)
router.get('/profile/securityQuestions', auth.isLoggedIn, controller.getSecurity);

// POST /users/profile/update: Handle updates to user details and security questions from the profile settings tab
router.post('/profile/update', auth.isLoggedIn, controller.updateProfile);

// GET /users/profile/sandbox: Render the sandbox mode
router.get('/profile/sandbox', auth.isLoggedIn, sandboxController.getSandbox);

// POST /users/profile/sandbox: Handle sandbox form actions
router.post('/profile/sandbox', sandboxController.handleActions);

// --- INBOX ROUTES ---

// GET /inbox: send inbox page to client
router.get('/inbox', auth.isLoggedIn, controller.getInbox);
router.post('/inbox/mark-read/:id', auth.isLoggedIn, controller.markAsRead);
router.post('/inbox/mark-all-read', auth.isLoggedIn, controller.markAllRead);

// --- INITIAL SECURITY QUESTION SETUP ROUTES ---

// GET /security-setup: Render the one-time security question setup page
router.get('/security-setup', auth.isLoggedIn, controller.getSecuritySetup);

// POST /security-setup: Handle saving the one-time security question
router.post('/security-setup', auth.isLoggedIn, controller.postSecuritySetup);


// --- PASSWORD RECOVERY ROUTES (Forgot Password) ---

// 1. GET /users/forgot: Renders form asking for email
router.get('/forgot', controller.forgotPassword);

// 2. POST /users/forgot-email: Handles email, finds user, shows security question (security-check.ejs)
router.post('/forgot-email', controller.postForgotEmail);

// 3. POST /users/reset: Handles security answer and new password submission
router.post('/reset', controller.postSecurityAnswer);

module.exports = router;
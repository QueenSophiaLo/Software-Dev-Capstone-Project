const express = require('express');
const controller = require('../controllers/userController');
const valid = require('../middleware/validator')
const auth = require('../middleware/auth')

// declare const

const router = express.Router();

//GET /sign-up: send sign-up page to client
router.get('/sign-up', controller.signup);

//GET /inbox: send inbox page to client
router.get('/inbox', controller.inbox);

//POST /users: create a new user
router.post('/sign-up', valid.validatorSignUp, valid.validateResults, controller.signupUser)

//GET /login: send login page to client
router.get('/log-in', controller.login);

//POST /login: start new user session
router.post('/log-in', valid.validateLogin, valid.validateResults, controller.loginUser);

//GET /profile: send profile page to client

//GET /logout: logout current user session
router.get('/logout', auth.isLoggedIn, controller.logOut);

module.exports = router;
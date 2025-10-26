const express = require('express');
const controller = require('../controllers/userController');

// declare const

const router = express.Router();

//GET /sign-up: send sign-up page to client
router.get('/sign-up', controller.signup);

//POST /users: create a new user
router.post('/sign-up', controller.signupUser)

//GET /login: send login page to client
router.get('/log-in', controller.login);

//POST /login: start new user session
router.post('/log-in', controller.loginUser);

//GET /profile: send profile page to client

//GET /logout: logout current user session

module.exports = router;
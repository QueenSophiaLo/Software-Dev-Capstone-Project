const express = require('express');
const controller = require('../controllers/mainController');

const router = express.Router();

// the routes below are example routes for the main page that are unrelated to the user or financial functionalities
// keep the index route but create new routes for "meet the team" and "contact us"
// Do we want to have a "ask questions" functionality on the contact us page?

//GET /
router.get('', controller.index);

//GET /meet-the-team
router.get('/meet-the-team', controller.team);

//GET /contact-us
router.get('/contact-us', controller.contact);

module.exports = router;
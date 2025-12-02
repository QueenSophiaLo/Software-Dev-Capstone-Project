const express = require('express');
const controller = require('../controllers/mainController');
const router = express.Router();

router.get('/', controller.index);
router.get('/meet-the-team', controller.team);
router.get('/contact-us', controller.contact);

module.exports = router;
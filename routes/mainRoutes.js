const express = require('express');
const controller = require('../controllers/mainController');

const router = express.Router();

//GET /
router.get('', controller.index);

//GET /about
router.get('/about', controller.about);

//GET /contact
router.get('/contact', controller.contact);

module.exports = router;
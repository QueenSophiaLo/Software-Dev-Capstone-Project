const express = require('express');
const router = express.Router();
const controller = require('../controllers/newsController');
const auth = require('../middleware/auth');

router.get('/', auth.isLoggedIn, controller.getNews);
router.get('/read', auth.isLoggedIn, controller.getNewsDetail);

module.exports = router;
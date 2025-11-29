// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/newsController');
const auth = require('../middleware/auth');

// GET /financials/news - Main feed (Protected)
router.get('/', auth.isLoggedIn, controller.getNews);

// GET /financials/news/read - Article viewer (Protected)
router.get('/read', auth.isLoggedIn, controller.getNewsDetail);

module.exports = router;
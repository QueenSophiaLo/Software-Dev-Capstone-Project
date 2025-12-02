const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController');
const tellerController = require('../controllers/tellerDataController');
const auth = require('../middleware/auth'); // Import Auth Middleware

// All routes here should likely be protected
router.use(auth.isLoggedIn); 

// GET /financials/ (Dashboard)
router.get('/', controller.index);

// GET /financials/budget (Budget Overview)
router.get('/budget', controller.bankaccount);
router.post('/budget', controller.saveNotes);

// GET /financials/add-bank
router.get('/add-bank', controller.budget);
router.post('/add-bank', tellerController.handleCallBack);

// GET /financials/resources
router.get('/resources', controller.resources);
router.get('/resources/:id', controller.resourceDetail);

module.exports = router;
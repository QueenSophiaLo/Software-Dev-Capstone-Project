const express = require('express');
const controller = require('../controllers/budgetController');

const router = express.Router();

// GET /budget-dashboard or home dashboard
router.get('/', controller.index);

// GET /add-bank
router.get('/add-bank', controller.budget);

// GET /budget
router.get('/budget', controller.bankaccount);

// GET /financials/resources
router.get('/resources', controller.resources);

// GET /financials/resources/:id
router.get('/resources/:id', controller.resourceDetail);

module.exports = router;

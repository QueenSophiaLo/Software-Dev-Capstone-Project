const Resource  = require('../models/resource');
const FinancialData = require('../models/finance-data')

// Dashboard / Home
exports.index = (req, res) => {
  res.render('index');
};

// Add Bank Account Page
exports.budget = (req, res) => {
  res.render('financials/add-bank', { applicationId: process.env.Teller_app_id });
};

// Budget Overview Page
exports.bankaccount = (req, res) => {
    // Check for real DB data
    FinancialData.findOne({userId: req.session.user})
    .then(data => {
        // Even if data is null, WE STILL RENDER THE PAGE.
        // We pass 'data' to the view. If it's null, the view (or client JS) 
        // should default to the hardcoded mock data.
        
        res.render('financials/budget', { 
            // If data exists, pass it. If not, pass null.
            financeData: data || null 
        });
    })
    .catch(err => {
        console.error(err);
        req.flash('error', 'Server error retrieving budget data.');
        res.redirect('/');
    });
};

// Show all resources (with search and filter)
// Called by /financials/resources
exports.resources = (req, res, next) => {
    let { category, search } = req.query;
    let filter = {};

    if (category) {
        filter.categories = category;
    }

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    Promise.all([
        Resource.find(filter),
        Resource.distinct('categories')
    ])
    .then(([resources, categories]) => {
        // This renders 'views/resources.ejs'
        res.render('./resources', { 
            resources, 
            categories, 
            selectedCategory: category,
            searchTerm: search 
        });
    })
    .catch(err => next(err));
};

// Show one resource (the viewer screen)
// Called by /financials/resources/:id
exports.resourceDetail = (req, res, next) => {
    let id = req.params.id;

    Resource.findById(id)
    .then(resource => {
        if (resource) {
            // This renders 'views/resource-detail.ejs'
            res.render('./resource-detail', { resource });
        } else {
            let err = new Error('Cannot find a resource with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
};
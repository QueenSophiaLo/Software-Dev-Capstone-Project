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
    FinancialData.findOne({userId: req.user._id})
    .then(data =>{
        if(!data){
            req.flash('error', 'No financial data found')
            return res.redirect("/")
        }
        res.render('/financials/budget')
    })
    .catch(err => {
        console.error(err);
        req.flash('error', 'Server error.');
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
const Resource = require('../models/resource');

exports.index = (req, res, next)=> {
    res.render('./index');
};

exports.team = (req, res, next)=> {
    res.render('./meet-the-team');
};

exports.contact = (req, res, next)=> {
    res.render('./contact-us');
};

// Show all resources (with search and filter)
exports.resources = (req, res, next) => {
    let { category, search } = req.query;
    let filter = {};

    // Apply category filter if it exists
    if (category) {
        filter.categories = category;
    }

    // Apply search filter if it exists
    if (search) {
        // This creates a case-insensitive search for the title
        filter.title = { $regex: search, $options: 'i' };
    }

    Promise.all([
        Resource.find(filter),
        Resource.distinct('categories') // Get all unique categories for filter buttons
    ])
    .then(([resources, categories]) => {
        res.render('./resources', { 
            resources, 
            categories, 
            selectedCategory: category, // Pass this to highlight the active filter
            searchTerm: search // Pass this to pre-fill the search bar
        });
    })
    .catch(err => next(err));
};

// Show one resource (the viewer screen)
exports.resourceDetail = (req, res, next) => {
    let id = req.params.id;

    Resource.findById(id)
    .then(resource => {
        if (resource) {
            res.render('./resource-detail', { resource });
        } else {
            let err = new Error('Cannot find a resource with id ' + id);
            err.status = 404;
            next(err);
        }
    })
    .catch(err => next(err));
};
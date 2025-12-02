const express = require('express');
const router = express.Router();

// Adjust the path below based on your actual project structure!
// Ensure these paths point to where your files actually exist.
const { calculateProjection } = require('../views/sandbox/utils/simulationEngine');
const { fetchUserBaseData } = require('../views/sandbox/utils/dataFetchers');

// --- GET /sandbox: Renders the initial page ---
// FIX 1: Changed path from '/' to '/sandbox'
router.get('/sandbox', async (req, res) => {
    
    // FIX 2: Changed 'req.user' to 'req.session.user' to match your app.js logic
    if (!req.session.user) {
        req.flash('error', 'You must be logged in to access the Sandbox Tool.');
        return res.redirect('/users/log-in');
    }

    try {
        // FIX 3: Use req.session.user._id (standard Mongo ID location in sessions)
        const userId = req.session.user._id || req.session.user.id;
        
        // 1. Fetch baseline data
        const baseData = await fetchUserBaseData(userId); 
        
        // 2. Define initial scenario inputs
        const initialInputs = { 
            monthlyContribution: baseData.monthlyContribution || 1000, 
            annualReturn: baseData.annualReturn || 7, 
            yearsToProject: 25 
        };
        
        // 3. Calculate the projection
        const defaultProjection = calculateProjection(baseData, initialInputs);

        res.render('sandbox/index', {
            title: 'Financial Sandbox',
            // Pass the session user explicitly if needed, though res.locals handles it
            currentUser: req.session.user, 
            baseData,
            initialInputs,
            defaultProjection,
        });
    } catch (error) {
        console.error("Error rendering Sandbox page:", error);
        req.flash('error', 'Could not load sandbox data.');
        res.redirect('/'); 
    }
});

// --- POST /api/sandbox/calculate: Handles client-side AJAX requests ---
router.post('/api/sandbox/calculate', async (req, res) => {
    // FIX 2: Check session user here as well
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const scenarioInputs = req.body;
        const userId = req.session.user._id || req.session.user.id;
        
        // Fetch fresh base data
        const baseData = await fetchUserBaseData(userId);
        
        // Calculate the new projection
        const projection = calculateProjection(baseData, scenarioInputs);

        res.json({ projection });

    } catch (error) {
        console.error("Error calculating sandbox scenario:", error);
        res.status(500).json({ error: 'Failed to run scenario calculation.' });
    }
});

module.exports = router;
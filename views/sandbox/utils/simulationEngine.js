// views/sandbox/utils/simulationEngine.js

/**
 * Calculates a future value projection based on compounding inputs.
 */
const calculateProjection = (baseData, scenarioInputs) => {
    // Merge the base data with the scenario changes
    // Default to empty objects if inputs are missing to prevent crashes
    const safeBase = baseData || { initialBalance: 0 };
    const safeInputs = scenarioInputs || {};

    const params = { ...safeBase, ...safeInputs };
    
    // Default values if parameters are missing
    let balance = params.initialBalance || 0;
    const annualReturn = params.annualReturn || 7;
    const monthlyContribution = params.monthlyContribution || 0;
    const durationYears = params.yearsToProject || 30;

    const timeline = [];

    for (let year = 1; year <= durationYears; year++) {
        // Apply the annual rate of return (interest/growth)
        balance = balance * (1 + (annualReturn / 100));
        
        // Apply any regular contributions
        balance += monthlyContribution * 12;
        
        timeline.push({ 
            year: year, 
            balance: parseFloat(balance.toFixed(2)) 
        });
    }

    return timeline;
};

// --- THIS IS THE FIX: Use CommonJS export ---
module.exports = { 
    calculateProjection 
};
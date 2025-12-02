// 1. IMPORT YOUR MODELS
// We go up 3 levels (../../..) to get from 'views/sandbox/utils' to the root
const User = require('../../../models/user'); 
// You can also import Sandbox if you want to load saved scenarios later
// const Sandbox = require('../../../models/sandbox'); 

const MOCK_BASE_DATA = {
    initialBalance: 5000,
    monthlyContribution: 500,
    annualReturn: 7
};

const fetchUserBaseData = async (userId) => {
    try {
        // 2. QUERY THE DATABASE
        const user = await User.findById(userId);

        if (!user) {
            console.log("User not found, using mock data.");
            return MOCK_BASE_DATA;
        }

        // 3. MAP REAL DATA TO SANDBOX INPUTS
        // We use 'user.money' from your schema as the starting balance
        return {
            initialBalance: user.money || 0, // Defaults to 0 if null
            monthlyContribution: 500, // Default value (since not in User model yet)
            annualReturn: 7,          // Default assumption
            yearsToProject: 10        // Default duration
        };

    } catch (error) {
        console.error("Error in fetchUserBaseData:", error);
        return MOCK_BASE_DATA; // Prevent crash by returning mock data
    }
};

// Use CommonJS export
module.exports = { 
    fetchUserBaseData 
};
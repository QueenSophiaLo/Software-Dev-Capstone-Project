// This script is run separately from your main app (node seed.js)
require("dotenv").config();
const mongoose = require('mongoose');
const Resource = require('./models/resource'); // Make sure this path is correct

// This is the data you want to add to your database
const resourcesToSeed = [
    {
        title: "The 50/30/20 Budgeting Rule Explained",
        description: "Learn the basics of the popular 50/30/20 rule to manage your income and savings.",
        type: "Article",
        content: "<p>The 50/30/20 rule is a simple budgeting framework that can help you manage your money effectively.</p><p>Here's how it breaks down:</p><ul><li><strong>50% for Needs:</strong> Rent/mortgage, groceries, utilities, transportation, etc.</li><li><strong>30% for Wants:</strong> Dining out, hobbies, entertainment.</li><li><strong>20% for Savings:</strong> Paying off debt, building an emergency fund, investing.</li></ul>",
        categories: ["Saving", "Budgeting"]
    },
    {
        title: "Investing for Beginners (A 7-Minute Guide)",
        description: "A quick-start guide to understanding the stock market and how to start investing.",
        type: "Video",
        videoUrl: "https://www.youtube.com/embed/qIw-yFC-HNU?si=f2HDdYtpTquH3gPD",
        categories: ["Investing", "Finance Basics"]
    },
    {
        title: "Understanding the Debt Snowball Method",
        description: "A popular strategy for paying off multiple debts, starting with the smallest balance first.",
        type: "Article",
        content: "<p>The Debt Snowball Method is a strategy for paying off debt, made popular by financial expert Dave Ramsey. Instead of focusing on the interest rates, you focus on momentum.</p><p>Here are the steps:</p><ol><li>List all your debts from the smallest balance to the largest.</li><li>Make minimum payments on all debts except the smallest one.</li><li>Pay as much as you possibly can on that smallest debt until it's gone.</li><li>Once the smallest debt is paid off, roll the payment you were making on it (plus the minimum) onto the next-smallest debt.</li></ol><p>This creates a 'snowball' effect, giving you psychological wins that keep you motivated to clear all your debts.</p>",
        categories: ["Debt", "Budgeting"]
    },
    {
        title: "What is a Roth IRA?",
        description: "Learn the basics of a Roth IRA and how it can be a powerful tool for tax-free retirement savings.",
        type: "Video",
        videoUrl: "https://www.youtube.com/embed/CuOzEX_Nck8?si=A4zSrRjW7P4KU_wB",
        categories: ["Retirement", "Investing"]
    },
    {
        title: "What is a Credit Score and Why Does It Matter?",
        description: "A complete beginner's guide to understanding what makes up your credit score and how it impacts your financial life.",
        type: "Article",
        content: "<h3>What is a Credit Score?</h3><p>A credit score is a three-digit number, typically between 300 and 850, that represents your creditworthiness. Lenders use this score to decide whether to loan you money and at what interest rate.</p><h3>What Makes Up Your Score?</h3><p>Scores are generally calculated based on five factors:</p><ul><li><strong>Payment History (35%):</strong> Do you pay your bills on time?</li><li><strong>Amounts Owed (30%):</strong> How much of your available credit are you using? (This is your credit utilization.)</li><li><strong>Length of Credit History (15%):</strong> How long have your accounts been open?</li><li><strong>New Credit (10%):</strong> Have you applied for a lot of new credit recently?</li><li><strong>Credit Mix (10%):</strong> Do you have a healthy mix of different types of credit (e.g., credit cards, a mortgage, an auto loan)?</li></ul>",
        categories: ["Credit", "Finance Basics"]
    },
    {
        title: "How to Build an Emergency Fund",
        description: "Why you need an emergency fund and practical steps to build one from scratch.",
        type: "Video",
        videoUrl: "https://www.youtube.com/embed/UE6PapZxYIs?si=U3XXaSslJR0ZLGXS",
        categories: ["Saving", "Finance Basics"]
    }
];

// The main seeder function
const seedDB = async () => {
    try {
        // Connect to the database.
        // This uses the SAME connection string your app.js uses.
        await mongoose.connect(process.env.mongo_uri2); 
        console.log('MongoDB connected for seeding...');

        // Clear out any old data to prevent duplicates
        await Resource.deleteMany({});
        console.log('Existing resources cleared...');

        // Insert the new data
        await Resource.insertMany(resourcesToSeed);
        console.log('Database successfully seeded!');

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        // Always close the connection, whether it succeeded or failed
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

// Run the seeder function
seedDB();

/*
How to Use This File:
Save: Save this code as seed.js in your project's main (root) folder.
Run: Open your terminal and run this one command:

node seed.js

Check: You'll see the console.log messages. After it says "Database successfully seeded!", 
open MongoDB Compass. You will see all this data in your resources collection, but with new _ids.

Share: Now, you can git add seed.js, commit it, and push it to GitHub. 
Your teammates can then pull it and run node seed.js to populate their own databases.
*/
const express = require('express');
const router = express.Router(); 
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config(); 
const mongoose = require('mongoose'); 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash"; 
const userChatSessions = {}; 

const Resource = require('../models/resource'); 
const FinanceData = require('../models/finance-data');
const Sandbox = require('../models/sandbox'); 

const MOCK_USER_ID_HEX = '60f7e4b9f2c69d0015b6d5f7'; 

function getObjectId(userId) {
    if (userId === MOCK_USER_ID_HEX) {
        return new mongoose.Types.ObjectId(MOCK_USER_ID_HEX);
    }
    try {
        return new mongoose.Types.ObjectId(userId);
    } catch (e) {
        console.error("Invalid user ID format:", userId);
        return null;
    }
}

async function get_user_budget_summary(userId) {
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return { status: "error", message: "Invalid user identifier." };
    
    try {
        let sandboxProfile = await Sandbox.findOneAndUpdate(
            { userId: userObjectId },
            { $setOnInsert: { monthlyIncome: 0, expenses: [] } }, 
            { new: true, upsert: true, lean: true }
        );
        const totalIncome = sandboxProfile.monthlyIncome || 0;
        const totalExpenses = sandboxProfile.expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const remainingCashFlow = totalIncome - totalExpenses;
        const status = remainingCashFlow >= 0 ? 'Surplus' : 'Deficit';

        const largestExpense = sandboxProfile.expenses.reduce((max, expense) => 
            (expense.amount > max.amount ? expense : max), { amount: 0, description: 'N/A' });
        
        return {
            status: status,
            monthlyIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            remainingCashFlow: remainingCashFlow.toFixed(2),
            largestExpense: largestExpense.description,
            largestExpenseAmount: largestExpense.amount.toFixed(2),
            message: `The user's current sandbox profile shows an income of $${totalIncome.toFixed(2)} and total expenses of $${totalExpenses.toFixed(2)}, resulting in a cash flow of $${remainingCashFlow.toFixed(2)}.`
        };

    } catch (error) {
        console.error("Database error in get_user_budget_summary:", error);
        return { error: "An error occurred while accessing sandbox data." };
    }
}

async function get_financial_resource(query) {
    try {
        const resources = await Resource.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { categories: { $in: [query] } }
            ]
        }).select('title description type videoUrl').limit(3).lean();

        if (resources.length === 0) {
            return { result: "No specific resources found for that query." };
        }

        return { 
            result: "resources found",
            count: resources.length,
            resources: resources.map(r => ({
                title: r.title,
                type: r.type,
                summary: r.description,
                link: r.videoUrl ? r.videoUrl : `/resources/view/${r._id}`
            }))
        };

    } catch (error) {
        console.error("Database error in get_financial_resource:", error);
        return { error: "An error occurred while searching resources." };
    }
}

async function log_transaction(userId, description, amount) {
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return { status: "error", message: "Invalid user identifier." };
    
    try {
        await Sandbox.findOneAndUpdate(
            { userId: userObjectId },
            { $setOnInsert: { monthlyIncome: 0, expenses: [] } },
            { new: true, upsert: true }
        );

        const updateResult = await Sandbox.findOneAndUpdate(
            { userId: userObjectId },
            { 
                $push: { expenses: { description: description, amount: Math.abs(amount) } },
            },
            { new: true }
        );

        return { 
            result: "Transaction logged successfully",
            status: `Logged ${description} for $${Math.abs(amount).toFixed(2)} to your sandbox expenses.`,
            newExpenseCount: updateResult.expenses.length
        };

    } catch (error) {
        console.error("Database error in log_transaction:", error);
        return { error: "An error occurred while logging the transaction." };
    }
}

const toolDeclarations = [
    {
        functionDeclarations: [
            {
                name: 'get_user_budget_summary',
                description: 'Retrieves the current financial status, remaining budget, and goal tracking for the user.',
                parameters: { type: 'OBJECT', properties: {} },
            },
            {
                name: 'navigate_to_page',
                description: 'Directs the user to a specific page on the financial planning website, such as Budget, Goals, or Reports.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        page_name: { type: 'STRING', description: 'The target page (e.g., "Budget", "Goals", "Reports", "Expense Tracker", "Login", "Sign Up").' },
                    },
                    required: ['page_name'],
                },
            },
            {
                name: 'get_financial_resource',
                description: 'Finds educational articles or videos on financial topics like investing, taxes, or mortgages.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        query: { type: 'STRING', description: 'The specific topic to search for (e.g., "Roth IRA" or "credit score").' },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'log_transaction',
                description: 'Logs a new expense or income transaction to the user’s financial records. Requires a description and a monetary amount.',
                parameters: {
                    type: 'OBJECT',
                    properties: {
                        description: { type: 'STRING', description: 'A short description of the transaction (e.g., "coffee", "monthly rent").' },
                        amount: { type: 'NUMBER', description: 'The transaction amount. Use a negative number for expenses and a positive number for income.' },
                    },
                    required: ['description', 'amount'],
                },
            },
        ],
    },
];

router.post('/', async (req, res) => {
    const userId = req.session.user?.toString() || MOCK_USER_ID_HEX; 
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message content is required.' });
    }

    if (!userChatSessions[userId]) {
        userChatSessions[userId] = []; 
    }

    let chatHistory = userChatSessions[userId];
    
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

    let response;
    let toolResponses = [];
    let finalNavigationCall = null;
    let loopCount = 0;

    while (loopCount < 5) { 
        loopCount++;

        let contents = chatHistory.slice(); 
        
        if (toolResponses.length > 0) {
            contents.push({
                role: "function",
                parts: toolResponses.map(res => ({
                    functionResponse: {
                        name: res.functionCall.name,
                        response: res.response
                    }
                }))
            });
            toolResponses = []; 
        }

        if (contents.length === 0) {
            break; 
        }

        try {
            response = await ai.models.generateContent({
                model: model,
                contents: contents, // Full history array
                config: {
                    tools: toolDeclarations,
                    systemInstruction: "You are the Financial Insights Navigator (FIN) Assistant. Your goal is to provide accurate, general financial advice and guide the user through the budgeting website. Use the provided tools to analyze their sandbox data and log new expenses.",
                }
            });
        } catch (e) {
            console.error("Gemini API Error (Critical Payload Issue):", e.message);
            delete userChatSessions[userId]; 
            return res.status(500).json({ response: "I'm sorry, I encountered a critical AI communication error. Please try restarting the chat." });
        }

        if (response.functionCalls && response.functionCalls.length > 0) {
            
            chatHistory.push({ role: "model", parts: [{ functionCall: response.functionCalls[0] }] });

            for (const call of response.functionCalls) {
                let toolResult;
                const funcName = call.name;
                const funcArgs = call.args;

                if (funcName === 'get_user_budget_summary') {
                    toolResult = await get_user_budget_summary(userId);
                } else if (funcName === 'navigate_to_page') {
                    finalNavigationCall = {
                        action: 'navigate',
                        target: funcArgs.page_name,
                        message: `Navigation target set to: ${funcArgs.page_name}.` 
                    };
                    toolResult = { result: finalNavigationCall.message }; 

                } else if (funcName === 'get_financial_resource') { 
                    toolResult = await get_financial_resource(funcArgs.query);
                } else if (funcName === 'log_transaction') { 
                    toolResult = await log_transaction(userId, funcArgs.description, funcArgs.amount);
                } else {
                    toolResult = { error: `Function ${funcName} not found` };
                }

                toolResponses.push({
                    functionCall: call, 
                    response: toolResult,
                });
            }
            
            continue; 
        } else {
            chatHistory.push(response.candidates[0].content);
            break; 
        }
    } 

    if (finalNavigationCall) {
        return res.json({ 
            action: finalNavigationCall.action,
            target: finalNavigationCall.target,
            response: response.candidates[0].content.parts[0].text 
        });
    }

    res.json({ response: response.candidates[0].content.parts[0].text });
});

module.exports = router;
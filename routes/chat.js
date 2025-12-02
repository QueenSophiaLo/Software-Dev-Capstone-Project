const express = require('express');
const router = express.Router(); 
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config(); 
const mongoose = require('mongoose'); 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-2.5-flash"; 
const userChatSessions = {}; 

// Models
const Resource = require('../models/resource'); 
const Sandbox = require('../models/sandbox'); 

// --- Helper Functions ---

// Safely convert ID
function getObjectId(userId) {
    try { return new mongoose.Types.ObjectId(userId); } 
    catch (e) { return null; }
}

// Tool: Get Summary
async function get_user_budget_summary(userId) {
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return { error: "Invalid User" };
    
    try {
        let profile = await Sandbox.findOne({ userId: userObjectId });
        if (!profile) return { message: "User has no sandbox profile yet." };

        const totalExpenses = profile.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const cashFlow = profile.monthlyIncome - totalExpenses;

        return {
            income: profile.monthlyIncome,
            expenses: totalExpenses,
            remaining: cashFlow,
            status: cashFlow >= 0 ? 'Surplus' : 'Deficit'
        };
    } catch (error) {
        return { error: "DB Error" };
    }
}

// Tool: Resources
async function get_financial_resource(query) {
    try {
        const resources = await Resource.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { categories: { $in: [query] } }
            ]
        }).select('title description type videoUrl').limit(3).lean();

        if (!resources.length) return { result: "No specific resources found." };
        
        return { 
            count: resources.length,
            items: resources.map(r => `${r.title} (${r.type})`)
        };
    } catch (error) {
        return { error: "DB Error" };
    }
}

// Tool: Log Transaction
async function log_transaction(userId, description, amount) {
    const userObjectId = getObjectId(userId);
    try {
        const profile = await Sandbox.findOneAndUpdate(
            { userId: userObjectId },
            { $push: { expenses: { description, amount: Math.abs(amount) } } },
            { new: true, upsert: true }
        );
        return { status: "success", newCount: profile.expenses.length };
    } catch (error) {
        return { error: "DB Error" };
    }
}

// --- Tool Definitions ---
const toolDeclarations = [{
    functionDeclarations: [
        {
            name: 'get_user_budget_summary',
            description: 'Retrieves current budget status (income, expenses, surplus).',
            parameters: { type: 'OBJECT', properties: {} }
        },
        {
            name: 'navigate_to_page',
            description: 'Navigate user to pages: Budget, Goals, Reports, Login, etc.',
            parameters: {
                type: 'OBJECT',
                properties: { page_name: { type: 'STRING' } },
                required: ['page_name']
            }
        },
        {
            name: 'get_financial_resource',
            description: 'Find articles/videos on finance topics.',
            parameters: {
                type: 'OBJECT',
                properties: { query: { type: 'STRING' } },
                required: ['query']
            }
        },
        {
            name: 'log_transaction',
            description: 'Log an expense.',
            parameters: {
                type: 'OBJECT',
                properties: { 
                    description: { type: 'STRING' },
                    amount: { type: 'NUMBER' } 
                },
                required: ['description', 'amount']
            }
        }
    ]
}];

// --- Main Chat Route ---
router.post('/', async (req, res) => {
    // Prefer session user, fallback to mock only if explicitly needed for testing
    const userId = req.session.user || 'MOCK_USER_ID_HEX'; 
    const userMessage = req.body.message;

    if (!userChatSessions[userId]) userChatSessions[userId] = [];
    const chatHistory = userChatSessions[userId];

    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

    let finalResponseText = "";
    let navigationAction = null;
    let toolResponses = [];

    // Max loops to prevent infinite tool calling
    for (let i = 0; i < 5; i++) {
        // Construct history + any pending tool responses
        const currentContent = [...chatHistory];
        if (toolResponses.length > 0) {
            currentContent.push({
                role: "function",
                parts: toolResponses.map(tr => ({
                    functionResponse: { name: tr.name, response: tr.response }
                }))
            });
            toolResponses = []; // Clear after adding
        }

        try {
            const result = await ai.models.generateContent({
                model: model,
                contents: currentContent,
                config: {
                    tools: toolDeclarations,
                    systemInstruction: "You are FIN (Financial Insights Navigator). be helpful and concise.",
                }
            });

            const response = result.response;
            const functionCalls = response.functionCalls();

            // If normal text response
            if (!functionCalls || functionCalls.length === 0) {
                finalResponseText = response.text();
                chatHistory.push({ role: "model", parts: [{ text: finalResponseText }] });
                break; // Done!
            }

            // If Function Call requested
            chatHistory.push({ role: "model", parts: [{ functionCall: functionCalls[0] }] });

            for (const call of functionCalls) {
                const args = call.args;
                let output;

                if (call.name === 'get_user_budget_summary') {
                    output = await get_user_budget_summary(userId);
                } else if (call.name === 'navigate_to_page') {
                    navigationAction = { action: 'navigate', target: args.page_name };
                    output = { status: "navigating" };
                } else if (call.name === 'get_financial_resource') {
                    output = await get_financial_resource(args.query);
                } else if (call.name === 'log_transaction') {
                    output = await log_transaction(userId, args.description, args.amount);
                }

                toolResponses.push({ name: call.name, response: output });
            }
        } catch (e) {
            console.error("AI Error:", e);
            return res.status(500).json({ response: "I encountered an error processing that." });
        }
    }

    const jsonResponse = { response: finalResponseText };
    if (navigationAction) {
        jsonResponse.action = navigationAction.action;
        jsonResponse.target = navigationAction.target;
    }
    
    res.json(jsonResponse);
});

module.exports = router;
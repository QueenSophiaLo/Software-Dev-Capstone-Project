// utils/notificationHandler.js
const Notification = require('../models/notification');

/**
 * Creates a notification in the database.
 * @param {string} userId - The recipient's ID
 * @param {string} title - The header (e.g., "Budget Warning")
 * @param {string} message - The body text
 * @param {string} type - 'info', 'warning', 'alert', or 'success'
 */
exports.createNotification = async (userId, title, message, type = 'info') => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type
        });
        console.log(`Notification created for user ${userId}`);
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};
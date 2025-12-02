process.env.NODE_ENV = 'test';
const { inbox, updateNotifications, markAsRead, markAllRead } = require('../controllers/userController');
const Notification = require('../models/notification');
const User = require('../models/user');

// Mock the models
jest.mock('../models/notification');
jest.mock('../models/user');

describe('Notification & Inbox Controller Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            session: { user: 'user123' },
            body: {},
            params: {},
            flash: jest.fn()
        };
        res = {
            render: jest.fn(),
            redirect: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- 1. Inbox Page Tests ---
    describe('inbox', () => {
        it('should fetch notifications for user and render inbox view', async () => {
            const mockNotifications = [
                { title: 'Alert', message: 'Over budget', createdAt: new Date() },
                { title: 'Info', message: 'Welcome', createdAt: new Date() }
            ];

            // Mock the chain: find().sort()
            const mockSort = jest.fn().mockResolvedValue(mockNotifications);
            Notification.find.mockReturnValue({
                sort: mockSort
            });

            await inbox(req, res, next);

            // Assertions
            expect(Notification.find).toHaveBeenCalledWith({ user: 'user123' });
            expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(res.render).toHaveBeenCalledWith('users/inbox', { notifications: mockNotifications });
        });

        it('should handle errors gracefully', async () => {
            const error = new Error('Database fail');
            Notification.find.mockImplementation(() => { throw error });

            await inbox(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    // --- 2. Notification Settings Tests ---
    describe('updateNotifications', () => {
        it('should update user notification preferences', async () => {
            // Setup form data (checkboxes send 'on' or undefined)
            req.body = {
                enabled: 'on',
                threshold: 'on',
                overbudget: 'on'
                // weekly/monthly missing (undefined)
            };

            const mockUser = {
                _id: 'user123',
                save: jest.fn()
            };
            User.findById.mockResolvedValue(mockUser);

            await updateNotifications(req, res, next);

            // Verify logic converts 'on' -> true and undefined -> false
            expect(mockUser.notifications.enabled).toBe(true);
            expect(mockUser.notifications.thresholdWarning).toBe(true);
            expect(mockUser.notifications.weeklySummary).toBe(false); // Was missing in body

            expect(mockUser.save).toHaveBeenCalled();
            expect(req.flash).toHaveBeenCalledWith('success', expect.stringContaining('updated'));
            expect(res.redirect).toHaveBeenCalledWith('/users/profile/notifications');
        });
    });

    // --- 3. Mark as Read Tests ---
    describe('markAsRead', () => {
        it('should find notification by ID and set isRead to true', async () => {
            req.params.id = 'notif_abc';
            
            Notification.findByIdAndUpdate.mockResolvedValue(true);

            await markAsRead(req, res, next);

            expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith('notif_abc', { isRead: true });
            expect(res.redirect).toHaveBeenCalledWith('/users/inbox');
        });
    });

    describe('markAllRead', () => {
        it('should update all unread notifications for the user', async () => {
            Notification.updateMany.mockResolvedValue(true);

            await markAllRead(req, res, next);

            expect(Notification.updateMany).toHaveBeenCalledWith(
                { user: 'user123', isRead: false }, 
                { isRead: true }
            );
            expect(res.redirect).toHaveBeenCalledWith('/users/inbox');
        });
    });
});
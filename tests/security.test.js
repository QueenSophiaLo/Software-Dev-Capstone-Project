process.env.NODE_ENV = 'test';
const { postForgotEmail, postSecurityAnswer } = require('../controllers/userController');
const model = require('../models/user');

// Mock the User model
jest.mock('../models/user');

describe('Security & Recovery Controller Tests', () => {
    let req, res, next;

    beforeEach(() => {
        // Reset mocks before each test
        req = {
            body: {},
            session: {},
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

    // --- Test 1: Initiating Password Recovery (Email Step) ---
    describe('postForgotEmail', () => {
        
        it('should find user, translate questions, and render security-check page', async () => {
            req.body.email = 'test@example.com';

            // Mock a user found in the DB with "short code" questions
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                securityQuestion1: 'pet',
                securityQuestion2: 'city',
                securityQuestion3: 'hero'
            };

            model.findOne.mockResolvedValue(mockUser);

            await postForgotEmail(req, res, next);

            // 1. Check that session was stored
            expect(req.session.recovery).toBeDefined();
            expect(req.session.recovery.userId).toBe('user123');

            // 2. Check that the VIEW was rendered with TRANSLATED questions
            // The controller converts 'pet' -> 'What was the name of your first pet?', etc.
            expect(res.render).toHaveBeenCalledWith('./users/security-check', expect.objectContaining({
                questions: [
                    'What was the name of your first pet?', 
                    'In what city were you born?', 
                    'Who was your childhood hero?'
                ],
                email: 'test@example.com'
            }));
        });

        it('should redirect back if user not found or incomplete questions', async () => {
            req.body.email = 'ghost@example.com';
            
            // Mock finding NO user
            model.findOne.mockResolvedValue(null);

            await postForgotEmail(req, res, next);

            expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('Email not found'));
            expect(res.redirect).toHaveBeenCalledWith('/users/forgot');
        });
    });

    // --- Test 2: Verifying Answers & Resetting Password ---
    describe('postSecurityAnswer', () => {

        it('should reset password if all 3 answers are correct', async () => {
            // Setup session data (simulating a user who passed step 1)
            req.session.recovery = { userId: 'user123' };
            
            // Setup form submission
            req.body = {
                answer1: 'Fluffy',
                answer2: 'Chicago',
                answer3: 'Batman',
                newPassword: 'newSecurePassword123'
            };

            // Mock the user instance that findById will return
            const mockUserInstance = {
                _id: 'user123',
                save: jest.fn(), // Mock the save function
                compareSecurityAnswer: jest.fn()
            };

            // Setup compareSecurityAnswer to return TRUE for all calls
            mockUserInstance.compareSecurityAnswer.mockResolvedValue(true);

            model.findById.mockResolvedValue(mockUserInstance);

            await postSecurityAnswer(req, res, next);

            // 1. Check that compare was called 3 times (once for each question)
            expect(mockUserInstance.compareSecurityAnswer).toHaveBeenCalledTimes(3);

            // 2. Check that password was updated
            expect(mockUserInstance.password).toBe('newSecurePassword123');
            
            // 3. Check that save() was called
            expect(mockUserInstance.save).toHaveBeenCalled();

            // 4. Check success flash and redirect
            expect(req.flash).toHaveBeenCalledWith('success', expect.stringContaining('Password reset successfully'));
            expect(res.redirect).toHaveBeenCalledWith('/users/log-in');
            
            // 5. Ensure session is cleared
            expect(req.session.recovery).toBeNull();
        });

        it('should fail if one answer is incorrect', async () => {
            req.session.recovery = { userId: 'user123' };
            req.body = { answer1: 'Wrong', answer2: 'Right', answer3: 'Right', newPassword: 'abc' };

            const mockUserInstance = {
                compareSecurityAnswer: jest.fn()
            };

            // Simulate Q1 failing, others passing
            mockUserInstance.compareSecurityAnswer
                .mockResolvedValueOnce(false) // Q1 wrong
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true);

            model.findById.mockResolvedValue(mockUserInstance);

            await postSecurityAnswer(req, res, next);

            expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('incorrect'));
            expect(res.redirect).toHaveBeenCalledWith('/users/forgot');
        });
    });
});
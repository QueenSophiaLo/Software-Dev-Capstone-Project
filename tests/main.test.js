process.env.NODE_ENV = 'test';
const { index } = require('../controllers/mainController');

describe('Main Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            // We don't need a user session here because the controller 
            // passes the data regardless. The View handles the hiding.
            session: {}, 
            flash: jest.fn()
        };
        res = {
            render: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Test: Widget Data Availability ---
    it('should render the homepage with the Financial Summary mock data', () => {
        // 1. Call the controller function
        index(req, res, next);

        // 2. Define the expected mock data structure
        const expectedWidgetData = {
            status: 'DEFICIT',
            netAmount: '($3,156.58)',
            income: '$2,599.02',
            expenses: '$5,755.60'
        };

        // 3. Assert that res.render was called with 'index' AND the data object
        expect(res.render).toHaveBeenCalledWith('./index', expect.objectContaining({
            financialSummary: expectedWidgetData
        }));
    });
});
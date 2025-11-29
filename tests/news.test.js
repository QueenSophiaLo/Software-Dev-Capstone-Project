process.env.NODE_ENV = 'test';
const { getNews } = require('../controllers/newsController');

describe('News Controller Unit Tests', () => {
    let req, res, next;
    // We need to save the original API Key to restore it after tests
    const ORIGINAL_API_KEY = process.env.NEWS_API_KEY;

    beforeEach(() => {
        // Setup standard Express mocks
        req = {
            query: {}, // Default empty query
            flash: jest.fn()
        };
        res = {
            render: jest.fn()
        };
        next = jest.fn();

        // Reset the environment variable for each test
        process.env.NEWS_API_KEY = 'TEST_KEY_123';

        // Spy on the global fetch function so we can fake the response
        // This prevents actual network requests
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear call history
        process.env.NEWS_API_KEY = ORIGINAL_API_KEY; // Restore real key
    });

    // --- Test 1: Happy Path (API Success) ---
    it('should fetch articles and render the news/index view', async () => {
        // 1. Mock the API data
        const mockArticles = [
            { title: 'Stock Market Up', description: 'Good news', urlToImage: 'img.jpg' },
            { title: 'Crypto Down', description: 'Bad news', urlToImage: 'img2.jpg' }
        ];

        // 2. Tell fetch what to return when called
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue({
                status: 'ok',
                articles: mockArticles
            })
        });

        // 3. Call the controller
        await getNews(req, res, next);

        // 4. Assertions
        // Check if fetch was called with the correct URL logic
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://newsapi.org/v2/top-headlines'));
        
        // Check if render was called with the correct data
        expect(res.render).toHaveBeenCalledWith('news/index', expect.objectContaining({
            articles: mockArticles,
            currentCategory: 'business'
        }));
        
        // Ensure no error flash messages
        expect(req.flash).not.toHaveBeenCalledWith('error', expect.anything());
    });

    // --- Test 2: Filtering Logic ---
    it('should construct the correct URL for "crypto" category', async () => {
        req.query.category = 'crypto';

        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue({ status: 'ok', articles: [] })
        });

        await getNews(req, res, next);

        // Expect URL to contain "everything?q=cryptocurrency"
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=cryptocurrency'));
        expect(res.render).toHaveBeenCalledWith('news/index', expect.objectContaining({
            currentCategory: 'crypto'
        }));
    });

    // --- Test 3: API Error Handling ---
    it('should handle API errors gracefully without crashing', async () => {
        // Simulate a "Bad Request" or API down
        global.fetch.mockResolvedValue({
            json: jest.fn().mockResolvedValue({
                status: 'error',
                message: 'Rate limit exceeded'
            })
        });

        await getNews(req, res, next);

        // Should NOT crash, but should render empty list
        expect(res.render).toHaveBeenCalledWith('news/index', expect.objectContaining({
            articles: []
        }));
        
        // Should show a flash error
        expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('Unable to load news'));
    });

    // --- Test 4: Missing API Key (Teammate Scenario) ---
    it('should NOT call fetch if API Key is missing', async () => {
        // Simulate the "Teammate" environment (No Key)
        delete process.env.NEWS_API_KEY;

        await getNews(req, res, next);

        // Fetch should NOT be called
        expect(global.fetch).not.toHaveBeenCalled();

        // Should render error page immediately
        expect(req.flash).toHaveBeenCalledWith('error', expect.stringContaining('News service is not configured'));
        expect(res.render).toHaveBeenCalledWith('news/index', { articles: [], currentCategory: 'business' });
    });
});
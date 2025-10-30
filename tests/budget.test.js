process.env.NODE_ENV = 'test';
const { addBank, budgetSheet, resources, resourceDetail } = require('../controllers/budgetController');
const model = require('../models/resource');

// Mock the Resource model
jest.mock('../models/resource');

describe('Budget Controller Unit Tests', () => {
    let req, res, next;

    // Set up fresh mock req, res, next objects before each test
    beforeEach(() => {
        req = {
            body: {},
            session: {},
            flash: jest.fn(),
            // Add query and params objects for filter and ID tests
            query: {},
            params: {}
        };
        res = {
            render: jest.fn(),
            redirect: jest.fn()
        };
        next = jest.fn();
    });
    
    // Clear all mocks after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test for the static pages
    /*describe('addBank', () => {
        it('should render the add-bank page', () => {
            addBank(req, res, next);
            expect(res.render).toHaveBeenCalledWith('financials/add-bank');
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('budgetSheet', () => {
        it('should render the budget page', () => {
            budgetSheet(req, res, next);
            expect(res.render).toHaveBeenCalledWith('financials/budget');
            expect(next).not.toHaveBeenCalled();
        });
    });*/

    // Tests for the new "resources" list page
    describe('resources', () => {
        it('should render the resources page with all resources and categories', async () => {
            const mockResources = [{ title: 'Resource 1' }, { title: 'Resource 2' }];
            const mockCategories = ['Saving', 'Debt'];

            // Mock the two database calls inside Promise.all
            model.find.mockResolvedValue(mockResources);
            model.distinct.mockResolvedValue(mockCategories);

            resources(req, res, next);
            // Wait for the promises to resolve
            await new Promise(process.nextTick);

            expect(model.find).toHaveBeenCalledWith({}); // Called with no filter
            expect(model.distinct).toHaveBeenCalledWith('categories');
            expect(res.render).toHaveBeenCalledWith('./resources', {
                resources: mockResources,
                categories: mockCategories,
                selectedCategory: undefined,
                searchTerm: undefined
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should apply search and category filters', async () => {
            req.query = { category: 'Saving', search: 'Test' };
            const mockResources = [{ title: 'Test Resource' }];
            const mockCategories = ['Saving', 'Debt'];

            model.find.mockResolvedValue(mockResources);
            model.distinct.mockResolvedValue(mockCategories);

            resources(req, res, next);
            await new Promise(process.nextTick);
            
            // Check that the filter object was built correctly
            const expectedFilter = {
                categories: 'Saving',
                title: { $regex: 'Test', $options: 'i' }
            };
            expect(model.find).toHaveBeenCalledWith(expectedFilter);

            // Check that the render options include the search terms
            expect(res.render).toHaveBeenCalledWith('./resources', {
                resources: mockResources,
                categories: mockCategories,
                selectedCategory: 'Saving',
                searchTerm: 'Test'
            });
        });

        it('should call next(err) if the database fails', async () => {
            const mockError = new Error('Database connection failed');
            model.find.mockRejectedValue(mockError);
            model.distinct.mockResolvedValue(['Saving']); // Still mock this, but find will fail first

            resources(req, res, next);
            await new Promise(process.nextTick);

            expect(res.render).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledWith(mockError);
        });
    });

    // Tests for the "resource detail" viewer page
    describe('resourceDetail', () => {
        it('should render the detail page for a valid resource ID', async () => {
            req.params.id = '12345';
            const mockResource = { _id: '12345', title: 'Test Resource', type: 'Article' };

            model.findById.mockResolvedValue(mockResource);

            resourceDetail(req, res, next);
            await new Promise(process.nextTick);

            expect(model.findById).toHaveBeenCalledWith('12345');
            expect(res.render).toHaveBeenCalledWith('./resource-detail', { resource: mockResource });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with a 404 error for an invalid resource ID', async () => {
            req.params.id = 'invalid-id';
            
            model.findById.mockResolvedValue(null); // Simulate "not found"

            resourceDetail(req, res, next);
            await new Promise(process.nextTick);

            expect(model.findById).toHaveBeenCalledWith('invalid-id');
            expect(res.render).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
            expect(next.mock.calls[0][0].status).toBe(404);
            expect(next.mock.calls[0][0].message).toContain('Cannot find a resource with id invalid-id');
        });
    });
});
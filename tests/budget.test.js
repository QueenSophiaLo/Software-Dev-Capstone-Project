process.env.NODE_ENV = 'test';
const { addBank, budgetSheet, resources, resourceDetail } = require('../controllers/budgetController');
const model = require('../models/resource');
const controller = require('../controllers/budgetController')
const FinancialData = require('../models/finance-data')

// Mock the Resource model
jest.mock('../models/resource');
jest.mock("../models/finance-data");

const flashMock = jest.fn();

const mockReq = (session = {}, body = {}) => ({
    session,
    body,
    flash: flashMock
  });
  
  const mockRes = () => {
    const res = {};
    res.render = jest.fn();
    res.redirect = jest.fn();
    return res;
  };

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

    describe("Controller: budget", () => {
        it("should render the add-bank page with applicationId", () => {
            const req = mockReq();
            const res = mockRes();
        
            process.env.Teller_app_id = "test-app-id";
        
            controller.budget(req, res);
        
            expect(res.render).toHaveBeenCalledWith("financials/add-bank", {
            applicationId: "test-app-id"
            });
        });
        });
        
        describe("Controller: bankaccount", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        
        it("should redirect if no financial data is found", async () => {
            const req = mockReq({ user: "123" });
            const res = mockRes();
        
            FinancialData.findOne.mockResolvedValue(null);
        
            await controller.bankaccount(req, res);
        
            expect(req.flash).toHaveBeenCalledWith("error", "No financial data found.");
            expect(res.redirect).toHaveBeenCalledWith("/");
        });
        
        it("should render the budget page with calculated data", async () => {
            const req = mockReq({ user: "123" });
            const res = mockRes();
        
            FinancialData.findOne.mockResolvedValue({
                accounts: [{ id: "acc1", type: "checking" }],
                balances: [{ account_id: "acc1", available: 500 }],
                transactions: [[
                    { id: "t1", amount: -20, type: "card_payment", date: "2025-01-01", description: "Test" }
                ]],
                targetSavings: [
                    { amount: 100, category: "vacation" },
                    { amount: 200, category: "emergency" }
                ],
                notes: "my note"
            });
        
            await controller.bankaccount(req, res);
            expect(res.render).toHaveBeenCalledWith(
                "financials/budget",
                expect.objectContaining({
                    accounts: [{ id: "acc1", type: "checking" }],
                    balances: [{ account_id: "acc1", available: 500 }],
                    notes: "my note",
                    incomeChart: [{ type: "checking", amount: 500 }],
                    recentTransactions: [
                        expect.objectContaining({
                            id: "t1",
                            amount: -20,
                        })
                    ],
                    budgetSummary: expect.objectContaining({
                        status: "ok",
                        totalIncome: 500,
                        totalExpense: 20,
                        targetExpenditure: 300, 
                        surplusDeficit: 500 - 20 
                    })
                })
            );
        });
        
        it("should redirect on server error", async () => {
                FinancialData.findOne.mockReturnValue({
                    then: () => Promise.reject(new Error("boom"))
                });

                await controller.bankaccount(req, res);

                expect(req.flash).toHaveBeenCalledWith(
                    "error",
                    "Server error retrieving budget data."
                );

                expect(res.redirect).toHaveBeenCalledWith("/");
            });
        });
        
        describe("Controller: saveNotes", () => {
        beforeEach(() => jest.clearAllMocks());
        
        it("should update notes and re-render budget", async () => {
            const req = mockReq(
            { user: "123" },
            { notes: "new note" }
            );
            const res = mockRes();
        
            FinancialData.findOneAndUpdate.mockResolvedValue({ notes: "new note" });
        
            controller.bankaccount = jest.fn();
        
            await controller.saveNotes(req, res);
        
            expect(FinancialData.findOneAndUpdate).toHaveBeenCalledWith(
            { userId: "123" },
            { notes: "new note" },
            { upsert: false, new: true }
            );
        
            expect(controller.bankaccount).toHaveBeenCalled();
        });
        
        it("should redirect if update returns null", async () => {
            const req = mockReq(
            { user: "123" },
            { notes: "test" }
            );
            const res = mockRes();
        
            FinancialData.findOneAndUpdate.mockResolvedValue(null);
        
            await controller.saveNotes(req, res);
        
            expect(req.flash).toHaveBeenCalledWith(
            "error",
            "Could not update notes."
            );
            expect(res.redirect).toHaveBeenCalledWith("/financial/budget");
        });
        
        it("should redirect on error", async () => {
            const req = mockReq(
            { user: "123" },
            { notes: "test" }
            );
            const res = mockRes();
        
            FinancialData.findOne.mockImplementation(() => Promise.reject("err"));
        
            await controller.saveNotes(req, res);
        
            expect(req.flash).toHaveBeenCalledWith(
            "error",
            "Could not update notes."
            );
        
            expect(res.redirect).toHaveBeenCalledWith("/financial/budget");
        });
        });

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
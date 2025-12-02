const Sandbox = require('../models/sandbox');
const User = require('../models/user');
const controller = require('../controllers/sandboxController');

jest.mock('../models/sandbox');
jest.mock('../models/user');


describe('Sandbox Controller Unit Tests', () =>{
    let req, res;

    beforeEach(() => {
        req = {
            session: { user: "123" },
            body: {},
            flash: jest.fn(),
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn()
        };

        jest.clearAllMocks();
    });

    function mockThenable(value) {
        return {
            then(cb) {
                const result = cb(value);
                return mockThenable(result);
            },
            catch() {}
        };
    }

    it("should render sandbox with user data", async () => {
        const fakeUser = { _id: "123", name: "Test User" };
        const fakeSandbox = {
            monthlyIncome: 5000,
            expenses: [{ description: "Rent", amount: 1500 }]
        };
    
        User.findById.mockResolvedValue(fakeUser);
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));

        await controller.getSandbox(req, res);
    
        expect(res.render).toHaveBeenCalledWith(
            "users/profile",
            expect.objectContaining({
                user: fakeUser,
                sandbox: fakeSandbox,
                totalExpenses: 1500,
                remaining: 3500
            })
        );
    });

    it("should use default sandbox if none exists", async () => {
        const fakeUser = { _id: "123" };
    
        User.findById.mockResolvedValue(fakeUser);
    
        Sandbox.findOne.mockReturnValue({
            then: (cb) => {
                cb(null); 
                return { catch: jest.fn() };
            }
        });
    
        await controller.getSandbox(req, res);
    
        expect(res.render).toHaveBeenCalledWith(
            "users/profile",
            expect.objectContaining({
                sandbox: { monthlyIncome: 0, expenses: [] },
                totalExpenses: 0,
                remaining: 0
            })
        );
    });

    it("should flash errors on failure", async () => {
        User.findById.mockResolvedValue({ _id: "123" });
    
        Sandbox.findOne.mockReturnValue({
            then: () => ({
                catch: (cb) => cb(new Error("fail"))
            })
        });
    
        await controller.getSandbox(req, res);
    
        expect(req.flash).toHaveBeenCalledWith("error", "Error getting sandbox");
    });

    it("should create sandbox if none exists", async () => {
        const fakeUser = { _id: "123" };
    
        User.findById.mockResolvedValue(fakeUser);
    
        Sandbox.findOne.mockReturnValue(mockThenable());

    
        Sandbox.create.mockResolvedValue({ monthlyIncome: 0, expenses: [] });
    
        req.body.action = "updateIncome";
    
        await controller.handleActions(req, res);
    
        expect(Sandbox.create).toHaveBeenCalled();
    });
    
    it("should update income", async () => {
        const fakeUser = { _id: "123" };
        const fakeSandbox = { monthlyIncome: 0, expenses: [], save: jest.fn().mockResolvedValue({}) };
    
        User.findById.mockResolvedValue(fakeUser);
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "updateIncome";
        req.body.monthlyIncome = "3000";
    
        await controller.handleActions(req, res);
    
        expect(fakeSandbox.monthlyIncome).toBe(3000);
        expect(fakeSandbox.save).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith("/users/profile/sandbox");
    });
    
    it("should add an expense", async () => {
        const fakeSandbox = {
            monthlyIncome: 0,
            expenses: [],
            save: jest.fn().mockResolvedValue({})
        };
    
        User.findById.mockResolvedValue({ _id: "123" });
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));

        req.body.action = "addExpense";
        req.body.description = "Groceries";
        req.body.amount = "120";
    
        await controller.handleActions(req, res);
    
        expect(fakeSandbox.expenses.length).toBe(1);
        expect(fakeSandbox.expenses[0]).toMatchObject({
            description: "Groceries",
            amount: 120
        });
        expect(fakeSandbox.save).toHaveBeenCalled();
    });
    
    it("should delete an expense", async () => {
        const expense = { _id: { toString: () => "abc" }, description: "Old", amount: 50 };
    
        const fakeSandbox = {
            monthlyIncome: 0,
            expenses: [expense],
            save: jest.fn().mockResolvedValue({})
        };
    
        User.findById.mockResolvedValue({ _id: "123" });
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "deleteExpense";
        req.body.expenseId = "abc";
    
        await controller.handleActions(req, res);
    
        expect(fakeSandbox.expenses.length).toBe(0);
        expect(fakeSandbox.save).toHaveBeenCalled();
    });

    it("should update income", async () => {
        const fakeUser = { _id: "123" };
        const fakeSandbox = { monthlyIncome: null, expenses: [], save: jest.fn().mockResolvedValue({}) };
    
        User.findById.mockResolvedValue(fakeUser);
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "updateIncome";
        req.body.monthlyIncome = "3000";
    
        await controller.handleActions(req, res);
    
        expect(fakeSandbox.monthlyIncome).toBe(3000);
        expect(fakeSandbox.save).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith("/users/profile/sandbox");
    });
    
    it("should add an expense", async () => {
        const fakeSandbox = {
            monthlyIncome: 0,
            expenses: [],
            save: jest.fn().mockResolvedValue({})
        };
    
        User.findById.mockResolvedValue({ _id: "123" });
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));

        req.body.action = "addExpense";
        req.body.description = "Groceries";
        req.body.amount = "120";
    
        await controller.handleActions(req, res);
    
        expect(fakeSandbox.expenses.length).toBe(1);
        expect(fakeSandbox.expenses[0]).toMatchObject({
            description: "Groceries",
            amount: 120
        });
        expect(fakeSandbox.save).toHaveBeenCalled();
    });
    
    it("should delete an expense", async () => {
        const expense = { _id: { toString: () => "abc" }, description: "Old", amount: 50 };
    
        const fakeSandbox = {
            monthlyIncome: 0,
            expenses: [expense],
            save: jest.fn().mockResolvedValue({})
        };
    
        User.findById.mockResolvedValue({ _id: "123" });
    
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "deleteExpense";
        req.body.expenseId = "abc";
    
        await controller.handleActions(req, res);
    
        expect(fakeSandbox.expenses.length).toBe(0);
        expect(fakeSandbox.save).toHaveBeenCalled();
    });

    it("should flash error when action is NOT updateIncome", async () => {
        const fakeSandbox = { expenses: [], save: jest.fn() };
    
        User.findById.mockResolvedValue({ _id: "123" });
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "notUpdateIncome";
    
        await controller.handleActions(req, res);
    
        expect(req.flash).toHaveBeenCalledWith("error", "Error with user action");
        expect(res.redirect).toHaveBeenCalledWith("/users/profile/sandbox");
    });
    
    it("should flash error when action is NOT addExpense", async () => {
        const fakeSandbox = { expenses: [], save: jest.fn() };
    
        User.findById.mockResolvedValue({ _id: "123" });
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "unknownAction";
    
        await controller.handleActions(req, res);
    
        expect(req.flash).toHaveBeenCalledWith("error", "Error with user action");
        expect(res.redirect).toHaveBeenCalledWith("/users/profile/sandbox");
    });

    it("should flash error when action is NOT deleteExpense", async () => {
        const fakeSandbox = { expenses: [], save: jest.fn() };
    
        User.findById.mockResolvedValue({ _id: "123" });
        Sandbox.findOne.mockReturnValue(mockThenable(fakeSandbox));
    
        req.body.action = "fooBar";
    
        await controller.handleActions(req, res);
    
        expect(req.flash).toHaveBeenCalledWith("error", "Error with user action");
        expect(res.redirect).toHaveBeenCalledWith("/users/profile/sandbox");
    });
    
})
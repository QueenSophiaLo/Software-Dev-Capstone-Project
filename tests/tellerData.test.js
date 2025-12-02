
const controller = require('../controllers/tellerDataController');
const FinancialData = require('../models/finance-data');
const User = require('../models/user');

jest.mock('../models/finance-data');
jest.mock('../models/user');

describe("Teller API Tests", () =>{
    let req, res;

    beforeEach(() => {
        req = {
            body: { access_token: 'fake-token' },
            session: { user: '123' },
            flash: jest.fn(),
        };

        res = {
            redirect: jest.fn(),
        };

        jest.clearAllMocks();
    });

    it('should save finance data and redirect on success', async () => {
        jest.spyOn(controller, 'fetchAcc').mockResolvedValue([
            { id: 'acc1' },
            { id: 'acc2' }
        ]);
        jest.spyOn(controller, 'fetchBal').mockResolvedValue({ available: 500 });
        jest.spyOn(controller, 'fetchTrans').mockResolvedValue([{ id: 't1', amount: 100 }]);

        FinancialData.prototype.save = jest.fn().mockResolvedValue({});
        User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

        await controller.handleCallBack(req, res);

        expect(controller.fetchAcc).toHaveBeenCalledWith('fake-token');
        expect(controller.fetchBal).toHaveBeenCalledTimes(2);
        expect(controller.fetchTrans).toHaveBeenCalledTimes(2);
        expect(FinancialData.prototype.save).toHaveBeenCalled();
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('123', { money: 1000 }); 
        expect(req.flash).toHaveBeenCalledWith('success', 'Successfully saved finance data');
        expect(res.redirect).toHaveBeenCalledWith('/financials/budget');
    });

    it("should flash error and redirect on failure", async () => {
        req.body.access_token = "bad-token";
    
        jest.spyOn(controller, 'fetchAcc').mockRejectedValue(new Error("Failed to fetch accounts"));
    
        await controller.handleCallBack(req, res);
    
        expect(req.flash).toHaveBeenCalledWith("error", "Failed to fetch accounts");
        expect(res.redirect).toHaveBeenCalledWith("/");
    });
    
})


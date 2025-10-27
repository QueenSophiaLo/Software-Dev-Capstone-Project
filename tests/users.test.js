
const { login, signup, loginUser, signupUser } = require('../controllers/userController');
const model = require('../models/user');

jest.mock('../models/user');

describe('User Controller Unit Tests', () =>{
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            session: {},
            flash: jest.fn(),
            get: jest.fn().mockReturnValue('/users/log-in')
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

    describe('login', () => {
        it('should render login page', () => {
            login(req, res);
            expect(res.render).toHaveBeenCalledWith('./users/login');
        });
    });

    describe('signup', () => {
        it('should render signup page', () => {
            signup(req, res);
            expect(res.render).toHaveBeenCalledWith('./users/new');
        });
    });
})
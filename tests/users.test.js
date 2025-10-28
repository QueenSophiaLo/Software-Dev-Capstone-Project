process.env.NODE_ENV = 'test';
const request = require('supertest')
const { login, signup, loginUser, signupUser } = require('../controllers/userController');
const model = require('../models/user');
const app = require('../app.js')


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

    describe('signup user', () =>{
        it('should signup a user successfully', async () =>{
            const saveMock = jest.fn().mockResolvedValue(true);

            model.mockImplementation(() => ({
                save: saveMock
            }))

            req.body = {
                name: 'Joe',
                email: 'new@test.com',
                password: '1234567890',
                confirmpassword: '1234567890'
            }  

            process.env.NODE_ENV = 'test';

            signupUser(req, res, next);
            await new Promise(process.nextTick);

            expect(saveMock).toHaveBeenCalled()
            expect(res.redirect).toHaveBeenCalledWith('/users/log-in')
        })

        it('should handle duplicate email error', async () => {
            const saveMock = jest.fn().mockRejectedValue({ code: 11000 });

            model.mockImplementation(() => ({ 
                save: saveMock 
            }));
    
            req.body = { 
                name: 'Joe',
                email: 'dup@test.com', 
                password: '12345678', 
                confirmpassword: '12345678' 
            };
            
            process.env.NODE_ENV = 'test';
    
            signupUser(req, res, next);
            await new Promise(process.nextTick);

            expect(res.redirect).toHaveBeenCalledWith('/users/sign-up');
        });

    })

    describe('login user', () =>{
        it('should log in successfully with the correct info', async () =>{
            const mockUser = {
                _id: 'id', 
                comparePassword: jest.fn().mockResolvedValue(true)
            }

            model.findOne.mockResolvedValue(mockUser)

            req.body = {
                email: 'x@y.com',
                password: 'qwertyuiop'
            }
            
            loginUser(req, res, next)
            await new Promise(process.nextTick);

            expect(mockUser.comparePassword).toHaveBeenCalledWith('qwertyuiop');
            expect(req.session.user).toBe('id');
            expect(req.flash).toHaveBeenCalledWith('success', 'You have successfully logged in');
            expect(res.redirect).toHaveBeenCalledWith('/');
        })

        it('should give an error when log in with incorrect password', async () =>{
            const mockUser = {
                _id: 'id', 
                comparePassword: jest.fn().mockResolvedValue(false)
            }

            model.findOne.mockResolvedValue(mockUser)

            req.body = {
                email: 'x@y.com',
                password: 'incorrect'
            }
            
            loginUser(req, res, next)
            await new Promise(process.nextTick);

            expect(mockUser.comparePassword).toHaveBeenCalledWith('incorrect');
            expect(req.flash).toHaveBeenCalledWith('error', 'Wrong Password');
            expect(res.redirect).toHaveBeenCalledWith('/users/log-in');
        })

        it('should give an error when log in with incorrect email', async () =>{
            model.findOne.mockResolvedValue(null)

            req.body = {
                email: 'incorrect@gmail.com',
                password: 'correct'
            }
            
            loginUser(req, res, next)
            await new Promise(process.nextTick);

            expect(model.findOne).toHaveBeenCalledWith({email: 'incorrect@gmail.com'});
            expect(req.flash).toHaveBeenCalledWith('error', 'Wrong Email');
            expect(res.redirect).toHaveBeenCalledWith('/users/log-in');
        })
    })
})

describe('User Routers Unit Test', () =>{

    describe('/GET: /users/sign-up', () =>{
        it('Should render the /sign-up page', async () =>{
            const res = await request(app).get('/users/sign-up')
            expect(res.statusCode).toBe(200);
        })
    })

    describe('/GET: /users/log-in', () =>{
        it('Should render the /sign-up page', async () =>{
            const res = await request(app).get('/users/log-in')
            expect(res.statusCode).toBe(200);
        })
    })

    describe('/GET: /users/logout', () =>{
        it('Should render the /logout page', async () =>{
            const res = await request(app).get('/users/logout')
            expect(res.statusCode).toBe(302);
        })
    })

    describe('/POST: /users/log-in', () =>{
        it('Should send post request for the /log-in route', async () =>{
            const res = await request(app).post('/users/log-in')
            expect(res.statusCode).toBe(302);
        })
    })

    describe('/POST: /users/log-in', () =>{
        it('Should send post request for the /sign-up route', async () =>{
            const res = await request(app).post('/users/sign-up')
            expect(res.statusCode).toBe(302);
        })
    })
    
})

describe('User Model Unit Test', () =>{

})
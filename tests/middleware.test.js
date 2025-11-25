process.env.NODE_ENV = 'test';
const { validateLogin, validatorSignUp } = require('../middleware/validator')
const { validationResult } = require('express-validator')

describe('Validation Middleware Testing', () =>{

    describe('Validate Login Testing', () =>{
        it('Should reject email with: empty', async () =>{
            const req = {
                body: {email: '', password: 'qwertyuiop'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validateLogin.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Email cannot be empty');
        })
    
        it('Should reject a non email with: valid email', async () =>{
            const req = {
                body: {email: 'invalidemail', password: 'qwertyuiop'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validateLogin.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Email must be valid email address');
        })
    
        it('Should reject a empty password with: empty password', async () =>{
            const req = {
                body: {email: 'test@gmail.com', password: ''},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validateLogin.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password cannot be empty');
        })

        it('Should reject a short password with: short password', async () =>{
            const req = {
                body: {email: 'test@gmail.com', password: '123'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validateLogin.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password must be atleast 8 characters and at most 64 characters');
        })

        it('Should reject a long password with: long password', async () =>{
            const req = {
                body: {email: 'test@gmail.com', password: '123456789123456789123456789123456789123456789123456789123456789123456789'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validateLogin.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password must be atleast 8 characters and at most 64 characters');
        })

        it('Should accept a valid login', async () =>{
            const req = {
                body: {email: 'test@gmail.com', password: '123456789'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validateLogin.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(true);
        })
    })

    describe('Validate SignUp Testing', () =>{
        it('Should reject name, email, password, confirm password with: empty', async () =>{
            const req = {
                body: {name: '' , email: '', password: '', confirmpassword: ''},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Name cannot be empty');
            expect(messages).toContain('Email cannot be empty');
            expect(messages).toContain('Password cannot be empty');
            expect(messages).toContain('Confirm Password cannot be empty');
        })

        it('Should reject a non email with: valid email', async () =>{
            const req = {
                body: {name: 'Joe', email: 'invalidemail', password: 'qwertyuiop', confirmpassword: 'qwertyuiop'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Email must be valid email address');
        })

        it('Should reject a empty password and confirm password with: empty passwords', async () =>{
            const req = {
                body: {name: 'Joe', email: 'test@gmail.com', password: '', confirmpassword: ''},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password cannot be empty');
            expect(messages).toContain('Confirm Password cannot be empty');
        })

        it('Should reject a empty password and confirm password with full to bail: empty password', async () =>{
            const req = {
                body: {name: 'Joe', email: 'test@gmail.com', password: '', confirmpassword: 'qwertyuiop'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password cannot be empty');
            expect(messages).not.toContain('Passwords do not match');
        })

        it('Should reject not matching emails: passwords dont match', async () =>{
            const req = {
                body: {name: 'Joe', email: 'test@gmail.com', password: '1234567890', confirmpassword: 'qwertyuiop'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Passwords do not match');
        })

        it('Should reject short password and short confirm password: short password', async () =>{
            const req = {
                body: {name: 'Joe', email: 'test@gmail.com', password: '123', confirmpassword: '123'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password must be atleast 8 characters and at most 64 characters');
            expect(messages).toContain('Confirm Password must be atleast 8 characters and at most 64 characters');
        })

        it('Should reject long password and long confirm password: long password', async () =>{
            const req = {
                body: {name: 'Joe', email: 'test@gmail.com', password: '123123123123123123123123123123123123123123123123123123123123123123123123123123123123', confirmpassword: '123123123123123123123123123123123123123123123123123123123123123123123123123123123123'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(false);
    
            const messages = errors.array().map(e => e.msg)
            expect(messages).toContain('Password must be atleast 8 characters and at most 64 characters');
            expect(messages).toContain('Confirm Password must be atleast 8 characters and at most 64 characters');
        })

        it('Should accept a valid login', async () =>{
            const req = {
                body: {name: 'Joe', email: 'test@gmail.com', password: '1234567890', confirmpassword: '1234567890'},
                get: jest.fn().mockReturnValue('/users/log-in'),
                flash: jest.fn()
            }
            
            const res = {
                redirect: jest.fn()
            };
            const next = jest.fn();
    
            await Promise.all(validatorSignUp.map(valid => valid.run(req)))
    
            const errors = validationResult(req);
            expect(errors.isEmpty()).toBe(true);
        })
    })
})
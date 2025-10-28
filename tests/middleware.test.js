process.env.NODE_ENV = 'test';

const { describe } = require('node:test');
const {validateLogin, validateResults} = require('../middleware/validator')

describe('Validation Middleware Testing', () =>{
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

        const errors = validateResults(req);
        expect(errors.isEmpty()).toBe(false);

        const errorArray = errors.array();
        expect(errorArray.some(e => e.param === 'email')).toBe(true);
    })
})
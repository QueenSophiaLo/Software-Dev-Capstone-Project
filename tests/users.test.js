const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

describe('POST /users/sign-up', () =>{
    const agent = request.agent(app);

    it('Should register a new user successfully', async () =>{
        const res = await request(app)
        .post('/users/sign-up')
        .set('Referer', '/users/log-in')
        .send({
            name: 'John',
            email: 'Johnson@gmail.com',
            password: 'qwertyuiop',
            confirmpassword: 'qwertyuiop'
        })
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/users/log-in');
    })

    it('Should give an error for empty fields and show flash messages', async () =>{
        const res = await agent
        .post('/users/sign-up')
        .set('Referer', '/users/sign-up')
        .type('form')
        .send({
            name: "Joe",
            email: "Joe@gmail.com",
            password: "qwertyuiop",
            confirmpassword: "1234567890"
        })
        .redirects(1)
        expect(res.text).toContain('Passwords do not match')
    })

    it('Should give an error for empty fields and show flash messages', async () =>{
        const res = await agent
        .post('/users/sign-up')
        .set('Referer', '/users/sign-up')
        .type('form')
        .send({
            name: '',
            email: '',
            password: '',
            confirmpassword: ''
        })
        .redirects(1)
        expect(res.text).toContain('Name cannot be empty')
        expect(res.text).toContain('Email cannot be empty')
        expect(res.text).toContain('Password cannot be empty')
        expect(res.text).toContain('Confirm Password cannot be empty')
    })
})

afterAll(async () => {
    await mongoose.connection.close();
  });
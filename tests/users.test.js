const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

// jest.mock('../models/user.js', () =>{
//     return jest.fn().mockImplementation((data) =>({
//         ...data,
//         save: jest.fn()
//     }))
// })

describe('POST /users/sign-up', () =>{
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
        console.log(res.status, res.headers);
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/users/log-in');
    })
})

afterAll(async () => {
    await mongoose.connection.close();
  });
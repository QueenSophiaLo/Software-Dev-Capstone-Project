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
        // console.log(res.status, res.headers);
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/users/log-in');
    })

    it('Should give an error for empty fields and show flash messages', async () =>{
        const res = await agent
        .post('/users/sign-up')
        .set('Referer', '/users/sign-up')
        .send({
            name: '',
            email: '',
            password: '',
            confirmpassword: ''
        })
        console.log(res.text)
        // console.log(res.status, res.headers);
        // expect(res.text).toContain('Name cannot be empty')
        // expect(res.text).toContain('Email cannot be empty')
        // expect(res.text).toContain('Password cannot be empty')
    })

    it('Should give an error when passwords don\'t match and show flash message', async () =>{
        // const res = await agent
        // .post('/users/sign-up')
        // .set('Referer', '/users/sign-up')
        // .send({
        //     name: 'John',
        //     email: 'Jonson@gmail.com',
        //     password: 'qwertyuiop',
        //     confirmpassword: '1234567890'
        // })
        // .redirects(1)
        // // console.log(res.status, res.headers);
        // expect(req.flash).toHaveBeenCalledWith('error', 'Passwords do not match');

        
    })
})

afterAll(async () => {
    await mongoose.connection.close();
  });
require("dotenv").config();
const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo')
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const User = require('./models/user')
const financeData = require("./models/finance-data");

const app = express();
let port = 3000;
let host = 'localhost';

app.set('trust proxy', true);
app.set('view engine', 'ejs');

const allowedIPs = process.env.ALLOWED_IPS.split(',');

function ipWhitelist(req, res, next) {
  const requestIP = req.ip.replace('::ffff:', '');
  console.log('Incoming request from IP:', requestIP);

  if (allowedIPs.includes(requestIP)) {
    return next();
  } else {
    return res.status(403).send('Access Denied: Your IP is not whitelisted');
  }
}

mongoose.connect(process.env.mongo_uri2 || process.env.mongo_uri)
.then(() =>{
    app.listen(port, host, () =>{
        console.log('Server is running on', port);
    })
})
.catch(err => console.log(err.message));

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'nfeiwofnieownfiow',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60*60*1000},
    store: new MongoStore({mongoUrl: process.env.mongo_uri})
}))

app.use(flash())

/**
 * Test add for db
 */

app.get('/test-add-user', async (req, res) => {
    try {
      const newUser = new User({
        firstName: 'Test User',
        lastName: 'Bobby',
        email: 'Bobby@charlotte.edu',
        password: 'Bello',
      });
      await newUser.save();
      res.send(`User created: ${newUser._id}`);
    } catch (err) {
      console.error('Error inserting user:', err.message);
      res.status(500).send('Failed to insert user.');
    }
});

app.get('/test-add-item', async (req, res) =>{
  try{
    const newItem = new financeData({
      category: 'Food',
      amount: 3000,
      date: '2004-01-27',
      description: 'Test'
    })
    await newItem.save();
    res.send(`Item made: ${newItem.category}`);
  } catch(err){
    console.error('Error adding item', err.message)
    res.status(500).set('Failed to insert item')
  }
});

app.use((req, res, next) =>{
    console.log(req.session)
    res.locals.user = req.session.user||null
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    next();
})

app.get('/', (req, res) =>{
    res.render('index');
})

app.use(ipWhitelist);

app.use((req, res, next) =>{
    let err = new Error('The server cannot locate ' + req.url);
    err.status = 404;
    next(err);
})

app.use((err, req, res, next) =>{
    console.log(err.stack)
    if(!err.status){
        err.status = 500;
        err.message = ("Internal Sever Error");
    }
    res.status(err.status);
    res.render('error', {error: err});
})
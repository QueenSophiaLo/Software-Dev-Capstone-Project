require("dotenv").config();
const express = require('express');
const morgan = require('morgan');
const mainrouter = require('./routes/mainRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const methodOverride = require('method-override');


const app = express();
let port = 3000;
let host = 'localhost';

app.set('trust proxy', true);
app.set('view engine', 'ejs');


if(process.env.NODE_ENV !== 'test'){
    mongoose.connect(process.env.mongo_uri2)
    .then(() =>{
        app.listen(port, host, () =>{
            console.log('Server is running on', port);
        })
    })
    .catch(err => console.log(err.message));
}

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'nfeiwofnieownfiow',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60*60*1000},
    store: new MongoStore({mongoUrl: process.env.mongo_uri2})
}))

app.use(flash())

app.use((req, res, next) =>{
    // console.log(req.session)
    res.locals.user = req.session.user|| null
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    next();
})

app.get('/', (req, res) =>{
    res.render('index');
})
app.use('/', mainrouter);
app.use('/users', userRoutes);



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

module.exports = app;
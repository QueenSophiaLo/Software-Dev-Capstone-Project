require("dotenv").config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');

// Routers
const mainRoutes = require('./routes/mainRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const budgetRoutes = require('./routes/budgetRoutes.js');
const newsRoutes = require('./routes/newsRoutes.js');

const app = express();
const port = 3000;
const host = 'localhost';

// --- View Engine ---
app.set('trust proxy', true);
app.set('view engine', 'ejs');

// --- Database & Server Startup ---
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.mongo_uri2)
    .then(() => {
      app.listen(port, host, () => {
        console.log(`Server is running on http://${host}:${port}`);
      });
    })
    .catch(err => console.log(err.message));
}

// --- Middleware ---
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(methodOverride('_method'));

// --- Session & Flash ---
app.use(session({
  secret: 'nfeiwofnieownfiow',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 },
  store: new MongoStore({ mongoUrl: process.env.mongo_uri2 })
}));

app.use(flash());

// --- Global Template Variables ---
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  next();
});


// --- Routes ---
// Main routes
app.use('/', mainRoutes);

// User routes
app.use('/users', userRoutes);

// Budget routes
app.use('/financials', budgetRoutes);

// News routes
app.use('/financials/news', newsRoutes);

// --- 404 Handler ---
app.use((req, res, next) => {
  const err = new Error('The server cannot locate ' + req.url);
  err.status = 404;
  next(err);
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.log(err.stack);
  if (!err.status) {
    err.status = 500;
    err.message = "Internal Server Error";
  }
  res.status(err.status);
  res.render('error', { error: err });
});

module.exports = app;
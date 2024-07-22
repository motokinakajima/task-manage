const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3');

// Route handlers
const indexRouter = require('./routes/index');
const projectRouter = require('./routes/project');
const loginRouter = require('./routes/login');

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Session configuration
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.use('/', indexRouter);
app.use('/project', projectRouter);
app.use('/login', loginRouter);

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack); // Log the full error stack

    if (process.env.NODE_ENV === 'development') {
        // Detailed error message in development
        res.status(err.status || 500).json({
            message: err.message,
            stack: err.stack
        });
    } else {
        // Generic error message in production
        res.status(err.status || 500).json({
            message: 'Something went wrong! Please try again later.'
        });
    }
});

module.exports = app;
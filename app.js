const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3');
const SQLiteStore = require('connect-sqlite3')(session);

// Route handlers
const indexRouter = require('./routes/index');
const projectRouter = require('./routes/project');
const loginRouter = require('./routes/login');
const dashboardRouter = require('./routes/dashboard');
const taskRouter = require('./routes/task');

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Session configuration
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: './public/db/'
    }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
//app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    console.log('Session:', req.session);
    next();
});

// Define routes
app.use('/', indexRouter);
app.use('/project', projectRouter);
app.use('/login', loginRouter);
app.use('/dashboard', dashboardRouter);
app.use('/task', taskRouter);

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
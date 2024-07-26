const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    secret: 'your secret key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.use('/', indexRouter);
app.use('/project', projectRouter);
app.use('/login', loginRouter);
app.use('/dashboard', dashboardRouter);
app.use('/task', taskRouter);

module.exports = app;
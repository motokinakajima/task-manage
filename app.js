const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
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
const profileRouter = require('./routes/profile');

// Initialize Express app
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key', // Replace with your secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to false for HTTP (local development)
        httpOnly: true, // Prevent client-side access to the cookie
        maxAge: 24 * 60 * 60 * 1000 // Cookie expires in 24 hours
    }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define routes
app.use('/', indexRouter);
app.use('/project', projectRouter);
app.use('/login', loginRouter);
app.use('/dashboard', dashboardRouter);
app.use('/task', taskRouter);
app.use('/profile', profileRouter);

module.exports = app;
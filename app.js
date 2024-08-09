const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const favicon = require('serve-favicon');
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

class SupabaseSessionStore extends session.Store {
    constructor() {
        super();
    }

    async get(sid, callback) {
        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('session_data')
                .eq('id', sid)
                .maybeSingle(); // maybeSingle will handle 0 or 1 row correctly
    
            if (error) {
                console.error('Error in get:', error);
                return callback(new Error('Failed to get session'));
            }
    
            if (data) {
                callback(null, data.session_data);
            } else {
                callback(null, null); // No session found, return null
            }
        } catch (err) {
            console.error('Exception in get:', err);
            callback(new Error('Failed to get session'));
        }
    }     

    async set(sid, sessionData, callback) {
        try {
            const expiresAt = sessionData.cookie.expires ? new Date(sessionData.cookie.expires) : null;
            const { error } = await supabase
                .from('sessions')
                .upsert({
                    id: sid,
                    session_data: sessionData,
                    expires_at: expiresAt
                });

            if (error) {
                console.error('Error in set:', error);
                return callback(new Error('Failed to set session'));
            }

            callback(null);
        } catch (err) {
            console.error('Exception in set:', err);
            callback(new Error('Failed to set session'));
        }
    }

    async destroy(sid, callback) {
        try {
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('id', sid);

            if (error) {
                console.error('Error in destroy:', error);
                return callback(new Error('Failed to destroy session'));
            }

            callback(null);
        } catch (err) {
            console.error('Exception in destroy:', err);
            callback(new Error('Failed to destroy session'));
        }
    }
}

// Initialize Express app
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    store: new SupabaseSessionStore(),
    secret: 'your-secret-key', // Replace with your secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Prevent client-side access to the cookie
        maxAge: 365 * 24 * 60 * 60 * 1000 // Cookie expires in 1 year
    },
    genid: () => uuidv4(), // Ensure UUIDs for session IDs
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

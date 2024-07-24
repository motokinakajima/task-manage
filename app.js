const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const Redis = require('ioredis');
const RedisStore = require('connect-redis').default;

// Route handlers
const indexRouter = require('./routes/index');
const projectRouter = require('./routes/project');
const loginRouter = require('./routes/login');
const dashboardRouter = require('./routes/dashboard');
const taskRouter = require('./routes/task');

// Initialize Express app
const app = express();

const redisClient = new Redis(process.env.REDIS_URL);

// Middleware setup
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Session configuration
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'fallback_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, maxAge: 86400000 } // 1 day
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

app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Session Data:', req.session);
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
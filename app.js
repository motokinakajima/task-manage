const express = require('express');
const session = require('express-session')
const bodyParser = require('body-parser');
const path = require('path');

const indexRouter = require('./routes/index');
const projectRouter = require('./routes/project');
const loginRouter = require('./routes/login');

const app = express();

app.set('view engine', 'ejs');
let session_opt = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
};

app.use(session(session_opt));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/project', projectRouter);
app.use('/login', loginRouter);

module.exports = app;

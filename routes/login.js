const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'public', 'db', 'mydb.sqlite3');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Database connected successfully');
    }
});

router.use(express.json());

router.get('/', (req, res, next) => {
    res.render('login');
});

router.get('/create', (req, res) => {
    res.render('create_account');
});

router.post('/', async (req, res) => {
    const { mail, password } = req.body;
    console.log(mail);

    try {
        // Get user details
        const user = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE mail = ? AND password = ?", [mail, password], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (user) {
            // Set session variables
            req.session.userID = user.userID;
            req.session.userName = user.name;
            res.redirect('/dashboard');
        } else {
            res.render('login');
        }
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create', async (req, res) => {
    let name = req.body['usr_name'];
    let mail = req.body['mail'];
    let password = req.body['password'];
    console.log('Received values:', { name, mail, password });

    try {
        // Check if email already exists
        const existingUsers = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM users WHERE mail = ?", [mail], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (existingUsers.length > 0) {
            return res.render('create_account', { error: 'Email already exists' });
        }

        // Generate a unique userID
        let userID;
        let isNotUnique = true;
        while (isNotUnique) {
            userID = "u" + Math.random().toString(36).substring(2);
            const existingIDs = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM users WHERE userID = ?", [userID], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            if (existingIDs.length === 0) {
                isNotUnique = false;
            }
        }

        // Insert new user
        await new Promise((resolve, reject) => {
            db.run("INSERT INTO users (userID, name, mail, password) VALUES (?, ?, ?, ?)", [userID, name, mail, password], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        req.session.userID = userID;
        req.session.userName = name;

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
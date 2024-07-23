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

router.get('/', function(req, res, next) {
    const p_id = req.query.pid;
    if (!p_id) {
        return res.redirect('/dashboard');
    } else {
        console.log(p_id);
        req.session.currentProject = p_id;

        const query = "SELECT * FROM projects WHERE projectID = ?";
        db.all(query, [p_id], (err, rows) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Internal Server Error');
            }
            console.log(rows);

            // Make sure to pass an object to res.render
            res.render('project', { rows: rows });
        });
    }
});

router.get('/create-task', (req,res,next) => { res.render('create_task'); });


router.post('/create-task', (req, res, next) => {
    if(!req.session.userID || !req.session.currentProject){
        res.redirect('/');
    }else {
        const task_name = req.body['task_name'];
        const task_description = req.body['task_description'];
        const due_date = req.body['due_date'];
        const priority = req.body['priority'];
        const risk = req.body['risk'];
        const p_id = req.session.currentProject;
        const sanitizedTableName = p_id.replace(/[^a-zA-Z0-9_]/g, '');
        db.serialize(() => {
            const query = `CREATE TABLE IF NOT EXISTS ${sanitizedTableName} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                projectID TEXT NOT NULL UNIQUE, 
                name TEXT NOT NULL,
                description TEXT NOT NULL, 
                created DATETIME NOT NULL, 
                due DATETIME NOT NULL, 
                priority TEXT NOT NULL, 
                risk TEXT NOT NULL
            )`;
            db.run(query, [], (err) => {
                if (err) {
                    console.error('Database query error:', err);
                    return res.status(500).send('Internal Server Error');
                }
                const schemaQuery = `PRAGMA table_info(${sanitizedTableName})`;
                db.all(schemaQuery, (schemaErr, schema) => {
                    if (schemaErr) {
                        console.error('Error fetching table schema:', schemaErr);
                        return res.status(500).send('Internal Server Error');
                    }

                    console.log(`Schema for table ${sanitizedTableName}:`, schema);
                    res.redirect('/project?pid='+p_id);
                });
            });
        });
    }
});

module.exports = router;

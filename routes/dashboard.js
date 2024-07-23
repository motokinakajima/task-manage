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
    console.log(req.session.userID);
    console.log(req.session.userName);
    if(!req.session.userID){
        res.redirect('/');
    }else {
        db.all("select * from projects", (err, rows) => {
            if (!err) {
                res.render('dashboard', {rows});
            }
        });
    }
});

router.get('/create-project', (req,res,next) => { res.render('create_project'); });

router.post('/create-project', async (req, res, next) => {
    const project_name = req.body['project_name'];
    const project_description = req.body['project_description'];
    let projectID;
    let isNotUnique = true;

    // Generate a unique projectID
    while (isNotUnique) {
        projectID = "p" + Math.random().toString(36).substring(2);
        try {
            const existingIDs = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM projects WHERE projectID = ?", [projectID], (err, rows) => {
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
        } catch (err) {
            console.error("Error checking for unique projectID:", err.message);
            return res.status(500).send('Internal Server Error');
        }
    }

    // Insert into projects table
    try {
        await new Promise((resolve, reject) => {
            db.run("INSERT INTO projects (projectID, name, description) VALUES (?, ?, ?)", [projectID, project_name, project_description], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log("A row has been inserted with rowId", this.lastID);
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error("Error inserting into projects:", err.message);
        return res.status(500).send('Internal Server Error');
    }

    // Sanitize table name and create table
    const sanitizedTableName = projectID.replace(/[^a-zA-Z0-9_]/g, '');

    try {
        await new Promise((resolve, reject) => {
            const query = `CREATE TABLE IF NOT EXISTS ${sanitizedTableName} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                taskID TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                created DATETIME NOT NULL,
                due DATETIME NOT NULL,
                priority TEXT NOT NULL,
                risk TEXT NOT NULL
            )`;
            db.run(query, [], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        // Log schema
        const schemaQuery = `PRAGMA table_info(${sanitizedTableName})`;
        db.all(schemaQuery, (schemaErr, schema) => {
            if (schemaErr) {
                console.error('Error fetching table schema:', schemaErr);
                return res.status(500).send('Internal Server Error');
            }
            console.log(`Schema for table ${sanitizedTableName}:`, schema);
        });

    } catch (err) {
        console.error('Database query error:', err);
        return res.status(500).send('Internal Server Error');
    }

    console.log(`Created project ${project_name}, id: ${projectID}`);
    res.redirect('/project/?pid=' + projectID);
});

module.exports = router;

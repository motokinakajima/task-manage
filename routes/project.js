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

        const queryProject = "SELECT * FROM projects WHERE projectID = ?";
        const queryTasks = `SELECT * FROM ${p_id}`;

        // Function to handle database queries
        const runQuery = (query, params) => {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        };

        // Execute both queries and wait for them to complete
        Promise.all([
            runQuery(queryProject, [p_id]),
            runQuery(queryTasks, [])
        ]).then(([projectData, tasks]) => {
            // Prepare data to render
            const data = {
                projectData: projectData,
                tasks: tasks,
            };

            // Render the page with data
            console.log(data);
            res.render('project', data);
        }).catch(err => {
            console.error('Database query error:', err);
            res.status(500).send('Internal Server Error');
        });
    }
});

router.get('/create-task', (req,res,next) => { res.render('create_task'); });


router.post('/create-task', async (req, res, next) => {
    if (!req.session.userID || !req.session.currentProject) {
        res.redirect('/');
    } else {
        const task_name = req.body['task_name'];
        const task_description = req.body['task_description'];
        const due_date = req.body['due_date'];
        const priority = req.body['priority'];
        const risk = req.body['risk'];
        const p_id = req.session.currentProject;
        let taskID;
        let isNotUnique = true;
        while (isNotUnique) {
            taskID = "t" + Math.random().toString(36).substring(2);
            console.log(`trying to make a ${task_name} id: ${taskID}`);
            const existingIDs = await new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${p_id} WHERE taskID = ?`, [taskID], (err, rows) => {
                    if (err) {
                        console.log(err);
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
        console.log(`trying to make a ${task_name} id: ${taskID}`);
        const insertQuery = `INSERT INTO ${p_id} (taskID, name, description, created, due, priority, risk) VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`;
        db.run(insertQuery, [taskID, task_name, task_description, due_date, priority, risk], function (err) {
            if (err) {
                console.error("Error inserting into projects:", err.message);
                //res.status(500).json({ message: "Internal Server Error", error: err.message });
            } else {
                console.log("A row has been inserted with rowId", this.lastID);
                //res.status(200).json({ message: "Project inserted successfully", projectID: this.lastID });
            }
        });

        const sanitizedTableName = taskID.replace(/[^a-zA-Z0-9_]/g, '');
        try {
            await new Promise((resolve, reject) => {
                const query = `CREATE TABLE IF NOT EXISTS ${sanitizedTableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            comment TEXT NOT NULL,
            commenter_id TEXT NOT NULL,
            commenter_name TEXT NOT NULL,
            created DATETIME NOT NULL
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

        res.redirect(`/project?pid=${p_id}`);
    }
});

module.exports = router;

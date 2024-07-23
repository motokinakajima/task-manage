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
router.get('/', (req,res,next) => {
    const t_id = req.query.tid;
    const p_id = req.query.pid;
    if(!t_id || !p_id){
        res.redirect('/dashboard');
    }else {
        console.log(t_id);
        req.session.currentTask = t_id;
        req.session.currentProject = p_id;

        const queryProject = "SELECT * FROM projects WHERE projectID = ?";
        const queryTasks = `SELECT * FROM ${p_id} WHERE taskID = ?`;
        const queryComments = `SELECT * FROM ${t_id}`;

        Promise.all([
            runQuery(queryProject, [p_id]),
            runQuery(queryTasks, [t_id]),
            runQuery(queryComments, [])
        ]).then(([projectData, tasks, comments]) => {
            const data = {
                projectData: projectData,
                taskData: tasks,
                comments: comments
            };

            console.log(data);
            res.render('task', data);
        }).catch(err => {
            console.error('Database query error:', err);
            res.status(500).send('Internal Server Error');
        });
    }
});

router.post('/', (req,res,next) => {
    const comment = req.body['comment'];
    const commenterID = req.session.userID;
    const commenterName = req.session.userName;
    const t_id = req.session.currentTask;
    const p_id = req.session.currentProject;
    if(!comment || !commenterID || !commenterName || !t_id || !p_id){
        res.redirect('/');
    }else {
        const queryProject = "SELECT * FROM projects WHERE projectID = ?";
        const queryTasks = `SELECT * FROM ${p_id} WHERE taskID = ?`;
        const queryComments = `SELECT * FROM ${t_id}`;
        const insertQuery = `INSERT INTO ${t_id} (comment, commenter_id, commenter_name, created) VALUES (?, ?, ?, datetime('now'))`;
        Promise.all([
            runQuery(insertQuery, [comment, commenterID, commenterName]),
            runQuery(queryProject, [p_id]),
            runQuery(queryTasks, [t_id]),
            runQuery(queryComments, [])
        ])
            .then(([insertResult, projectData, tasks, comments]) => {
                const data = {
                    projectData: projectData,
                    taskData: tasks,
                    comments: comments
                };

                console.log(data);
                res.render('task', data);
            })
            .catch(err => {
                console.error('Database query error:', err);
                res.status(500).send('Internal Server Error');
            });
    }
});


module.exports = router;
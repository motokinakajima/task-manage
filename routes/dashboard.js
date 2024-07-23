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

router.post('/create-project',async (req, res, next) => {
    const project_name = req.body['project_name'];
    const project_description = req.body['project_description'];
    let projectID;
    let isNotUnique = true;
    while (isNotUnique) {
        projectID = "p" + Math.random().toString(36).substring(2);
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
    }
    db.run("insert into projects (projectID, name, description) values (?, ?, ?)", [projectID, project_name, project_description], function(err) {
        if (err) {
            console.error("Error inserting into projects:", err.message);
            //res.status(500).json({ message: "Internal Server Error", error: err.message });
        } else {
            console.log("A row has been inserted with rowId", this.lastID);
            //res.status(200).json({ message: "Project inserted successfully", projectID: this.lastID });
        }
    });

    console.log(`created project ${project_name}, id: ${projectID}`);
    res.redirect('/project/?pid=' + projectID);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res, next) => {
    const p_id = req.query.pid;
    if (!p_id) {
        return res.redirect('/dashboard');
    } else {
        req.session.currentProject = p_id;

        const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('projectID', p_id);
        const { data: taskData, error: taskError } = await supabase.from('tasks').select('*').eq('projectID', p_id);

        const data = {
            projectData: projectData,
            tasks: taskData,
        };

        res.render('project', data);
    }
});

router.get('/create-task', (req,res,next) => { req.session.userID? res.render('create_task') : res.redirect('/dashboard'); });


router.post('/create-task', async (req, res, next) => {
    const p_id = req.session.userID
    if (!p_id) {
        res.redirect('/');
    } else {
        const { task_name, task_description, start_date, due_date, priority, risk, responsible, accountable, consulted, informed} = req.body;
        console.log(req.body);
        let newTaskID;
        let isUnique = false;

        while(!isUnique) {
            newTaskID = "t" + Math.random().toString(36).substring(2);
            const { data, error } = await supabase.from('tasks').select('*').eq('taskID', newTaskID);
            if(!data){
                isUnique = true;
            }
        }

        const { error } = await supabase.from('tasks').insert({ taskID: newTaskID, projectID: p_id, name: task_name, description: task_description,
            start: start_date, due: due_date, priority: priority, risk: risk, responsible: responsible, accountable: accountable, consulted: consulted, informed: informed});
        console.log(error);
        res.redirect(`/project?pid=${p_id}`);
    }
});

module.exports = router;

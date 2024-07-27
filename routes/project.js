const express = require('express');
const router = express.Router();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res, next) => {
    const p_id = req.query.pid;
    req.session.currentProject = p_id;
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

router.get('/create-task', async (req,res,next) => {
    const { data, error } = await supabase.from('users').select('*');
    const namesOnly = data.map(user => ({ name: user.name }));
    req.session.userID? res.render('create_task' ,{ users: namesOnly }) : res.redirect('/dashboard');
});


router.post('/create-task', async (req, res, next) => {
    const { task_name, task_description, start_date, due_date, priority, risk, responsible, accountable, consulted, informed} = req.body;
    const p_id = req.session.currentProject;
    if (!p_id || !task_name || !task_description || !start_date || !due_date || !priority || !risk || !responsible || !accountable || !consulted || !informed) {
        res.redirect('dashboard/');
    } else {
        let newTaskID;
        let isUnique = false;

        while(!isUnique) {
            newTaskID = "t" + Math.random().toString(36).substring(2);
            const { data, error } = await supabase.from('tasks').select('*').eq('taskID', newTaskID);
            if(!data[0]){
                isUnique = true;
            }
        }

        const { error } = await supabase.from('tasks').insert({ taskID: newTaskID, projectID: p_id, name: task_name, description: task_description,
            start: start_date, due: due_date, priority: priority, risk: risk, responsible: responsible, accountable: accountable, consulted: consulted, informed: informed });
        res.redirect(`/project?pid=${p_id}`);
    }
});

router.get('/edit-project', async (req, res, next) => {
    const p_id = req.query.pid;
    if(!p_id || !req.session.userID){
        res.redirect('/dashboard');
    }else{
        req.session.currentProject = p_id;
        const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('projectID', p_id);
        res.render('edit_project', { projectData: projectData });
    }
});

router.post('/edit-project', async(req, res, next) => {
    const { project_name, project_description } = req.body;
    const p_id = req.session.currentProject;
    if(!p_id || !project_name || !project_description){
        res.redirect('/dashboard');
    }else{
        const { error } = await supabase.from('projects').update( {name: project_name, description: project_description }).eq('projectID', p_id);
        res.redirect(`/project?pid=${p_id}`);
    }
});

router.post('/delete-project', async (req, res, next) => {
    const projectID = req.body['projectID'];
    const { error } = await supabase.from('projects').delete().eq('projectID', projectID);
    const { _error } = await supabase.from('tasks').delete().eq('projectID', projectID);
    res.redirect('/dashboard');
})

module.exports = router;

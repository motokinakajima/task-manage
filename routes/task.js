const express = require('express');
const router = express.Router();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req,res,next) => {
    const t_id = req.query.tid;
    const p_id = req.query.pid;
    if(!t_id || !p_id){
        res.redirect('/dashboard');
    }else {
        req.session.currentTask = t_id;
        req.session.currentProject = p_id;

        const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('projectID', p_id);
        const { data: taskData, error: taskError } = await supabase.from('tasks').select('*').eq('taskID', t_id);
        const { data: commentData, error: commentError } = await supabase.from('comments').select('*').eq('taskID', t_id);

        const returnData = {
            projectData: projectData,
            taskData: taskData,
            comments: commentData
        }

        res.render('task', returnData);
    }
});

router.post('/', async (req,res,next) => {
    const comment = req.body['comment'];
    const commenterID = req.session.userID;
    const commenterName = req.session.userName;
    const t_id = req.session.currentTask;
    const p_id = req.session.currentProject;
    if(!comment || !commenterID || !commenterName || !t_id || !p_id){
        res.redirect('/');
    }else {
        const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('projectID', p_id);
        const { data: taskData, error: taskError } = await supabase.from('tasks').select('*').eq('taskID', t_id);
        const { data: commentData, error: commentError } = await supabase.from('comments').select('*').eq('taskID', t_id);
        const { error: insertError } = await supabase.from('comments').insert({ taskID: t_id, comment: comment, commenter_id: commenterID, commenter_name: commenterName });
        const returnData = {
            projectData: projectData,
            taskData: taskData,
            comments: commentData
        }
        res.redirect(`/task?pid=${p_id}&tid=${t_id}`);
    }
});

router.get('/edit-task', async (req, res, next) => {
    const p_id = req.query.pid;
    const t_id = req.query.tid;
    if(!p_id || !t_id){
        res.redirect('/dashboard');
    }else{
        req.session.currentProject = p_id;
        req.session.currentTask = t_id;
        const { data: taskData, error } = await supabase.from('tasks').select('*').eq('taskID', t_id);
        res.render('edit_task', { taskData: taskData });
    }
});

router.post('/edit-task', async (req, res, next) => {
    const { task_name, task_description, start_date, due_date, priority, risk, responsible, accountable, consulted, informed} = req.body;
    const p_id = req.session.currentProject;
    const t_id = req.session.currentTask;
    if(!p_id || !t_id || !task_name || !task_description || !start_date || !due_date || !priority || !risk || !responsible || !accountable || !consulted || !informed){
        res.redirect('/dashboard');
    }else{
        const { error } = await supabase.from('tasks').update({ taskID: t_id, projectID: p_id, name: task_name, description: task_description,
            start: start_date, due: due_date, priority: priority, risk: risk, responsible: responsible, accountable: accountable, consulted: consulted, informed: informed }).eq('taskID', t_id);
        res.redirect(`/task?pid=${p_id}&tid=${t_id}`);
    }
});

module.exports = router;
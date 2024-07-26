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


module.exports = router;
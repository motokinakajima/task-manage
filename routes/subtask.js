const express = require('express');
const router = express.Router();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { transliterate } = require('transliteration');
const EmailSender = require('../EmailSender');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const emailSender = new EmailSender(process.env.GMAIL_USER,process.env.GMAIL_CLIENT_ID,process.env.GMAIL_CLIENT_SECRET,process.env.GMAIL_REFRESH_TOKEN);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function getProgress(input){
    switch(input){
        case -1:return "開始前";
        case 0:return "進行中";
        case 1:return "完了";
    }
}

router.get('/', async (req, res, next) => {
    const s_id = req.query.sid;
    const { data: taskID, error: taskError } = await supabase.from('subtasks').select('taskID').eq('subtaskID', s_id);
    if(!s_id || !taskID[0]['taskID']){
        res.redirect('/dashboard');
    }else {
        const { data: projectID, error: projectError } = await supabase.from('tasks').select('projectID').eq('taskID', taskID[0]['taskID']);
        if(!projectID[0]['projectID']){
            res.redirect('/dashboard');
        }else {
            const t_id = taskID[0]['taskID'];
            const p_id = projectID[0]['projectID'];
            req.session.currentSubtask = s_id;
            req.session.currentTask = t_id;
            req.session.currentProject = p_id;

            const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('projectID', p_id);
            const { data: taskData, error: taskError } = await supabase.from('tasks').select('*').eq('taskID', t_id);
            const { data: subtaskData, error: subtaskError } = await supabase.from('subtasks').select('*').eq('subtaskID', s_id);
            const { data: userData, error } = await supabase.from('users').select('userID, name');
            const { data: commentData, error: commentError } = await supabase.from('comments').select('*').eq('taskID', s_id);

            const returnData = {
                projectData: projectData,
                taskData: taskData,
                subtaskData: subtaskData,
                userID: req.session.userID,
                users: userData,
                comments: commentData
            };

            res.render('subtask', returnData);
        }
    }
});

module.exports = router;
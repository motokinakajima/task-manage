const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');
const EmailSender = require('../EmailSender');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const emailSender = new EmailSender(process.env.GMAIL_USER,process.env.GMAIL_CLIENT_ID,process.env.GMAIL_CLIENT_SECRET,process.env.GMAIL_REFRESH_TOKEN);

router.get('/', async (req, res, next) => {
    if(!req.session.userID || !req.session.userName){
        res.redirect('/')
    }else {
        const { data: projectData, error: error } = await supabase.from('projects').select('*');
        const { data: taskData, error: _error } = await supabase.from('tasks').select('*').eq('responsible', req.session.userID);
        const { data: users, error: __error } = await supabase.from('users').select('userID, name');
        res.render('dashboard', { projects: projectData, userID: req.session.userID, userName: req.session.userName, userID: req.session.userID, taskData: taskData, users: users });
    }
});

router.get('/create-project', (req,res,next) => { req.session.userID ? res.render('create_project', { userID: req.session.userID }) : res.redirect('/dashboard'); });

router.post('/create-project', async (req, res, next) => {
    const { project_name, project_description } = req.body;
    let newProjectID;
    let isUnique = false;

    while(!isUnique){
        newProjectID = "p" + Math.random().toString(36).substring(2);
        const { data, error } = await supabase.from('projects').select('*').eq('projectID', newProjectID);
        if(!data[0]){
            isUnique = true;
        }
    }

    const { error } = await supabase.from('projects').insert({ projectID: newProjectID, name: project_name, description: project_description });

    res.redirect('/project/?pid=' + newProjectID);

    const { data: userData, errpr: _error } = await supabase.from('users').select('*');

    userData.forEach(user => {
        emailSender.sendEmail(user.email, "新規プロジェクトが作成されました", "", `<h1>プロジェクト作成</h1><p><a href="https://task-manager-seven-pink.vercel.app/project?pid=${newProjectID}">${project_name}</a>というプロジェクトが作成されました。確認しましょう。</p><br><p>作成者：${req.session.userID}</p>`).then(() => {console.log("sent email succesfully");}).catch((error) => {console.error('Failed to send email:', error);});
    });

});

module.exports = router;

const express = require('express');
const router = express.Router();
const EmailSender = require('../EmailSender');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const emailSender = new EmailSender(process.env.GMAIL_USER,process.env.GMAIL_CLIENT_ID,process.env.GMAIL_CLIENT_SECRET,process.env.GMAIL_REFRESH_TOKEN);

router.get('/', async (req, res) => {
    if(!req.session.userID || !req.session.userName){
        res.redirect('/')
    }else {
        const {data: projectData, error: projectError} = await supabase.from('projects').select('*');
        const {
            data: responsibleTask,
            error: responsibleTaskError
        } = await supabase.from('tasks').select('*').eq('responsible', req.session.userID);
        const {
            data: accountableTask,
            error: accountableTaskError
        } = await supabase.from('tasks').select('*').eq('accountable', req.session.userID);
        const {
            data: consultedTask,
            error: consultedTaskError
        } = await supabase.from('tasks').select('*').eq('consulted', req.session.userID);
        const {
            data: informedTask,
            error: informedTaskError
        } = await supabase.from('tasks').select('*').eq('informed', req.session.userID);
        const {data: users, error: usersError} = await supabase.from('users').select('userID, name');
        if (projectError || responsibleTaskError || accountableTaskError || consultedTaskError || informedTaskError || usersError) {
            res.render('error', {
                message: 'An error occurred while fetching data',
                error: projectError || responsibleTaskError || accountableTaskError || consultedTaskError || informedTaskError || usersError
            });
        } else {
            res.render('dashboard', {
                projects: projectData,
                userID: req.session.userID,
                userName: req.session.userName,
                responsibleTask: responsibleTask,
                accountableTask: accountableTask,
                consultedTask: consultedTask,
                informedTask: informedTask,
                users: users
            });
        }
    }
});

router.get('/create-project', (req, res,) => {
    req.session.userID ? res.render('create_project', {userID: req.session.userID}) : res.redirect('/dashboard');
});

router.post('/create-project', async (req, res,) => {
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

    const { data: userData, error: userError } = await supabase.from('users').select('*');

    if (userError) {
        console.error('Failed to fetch users:', userError);
    } else {
        userData.forEach(user => {
            let userName = "";
            userData.forEach(currentUser => {
                if (currentUser.userID === req.session.userID) {
                    userName = currentUser.name;
                }
            });
            emailSender.sendEmail(user.email, "新規プロジェクトが作成されました", "", `<h1>プロジェクト作成</h1><p><a href="${process.env.PRODUCT_URL}project?pid=${newProjectID}">${project_name}</a>というプロジェクトが作成されました。確認しましょう。</p><br><p>作成者：${userName}</p>`)
                .then(() => {
                    console.log("sent email successfully");
                })
                .catch((error) => {
                    console.error('Failed to send email:', error);
                });
        });
    }

});

module.exports = router;

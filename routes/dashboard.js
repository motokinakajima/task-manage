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
    if(!req.session.userID || !req.session.userName){
        res.redirect('/');
    }else {
        const { data: projectData, error: error } = await supabase.from('projects').select('*');
        res.render('dashboard', { projects: projectData, userID: req.session.userID, userName: req.session.userName, userID: req.session.userID });
    }
});

router.get('/create-project', (req,res,next) => { req.session.userID? res.render('create_project', { userID: req.session.userID }) : res.redirect('/dashboard'); });

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
});

module.exports = router;

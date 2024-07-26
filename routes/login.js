const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', (req, res, next) => {
    res.render('login');
});

router.get('/create', (req, res) => {
    res.render('create_account');
});

router.post('/', async (req, res) => {
    const { mail, password } = req.body;

    const { data, error } = await supabase.from('users').select('*').eq('email', mail);

    if(data[0].email == mail && data[0].password == password){
        req.session.userID = data[0].userID;
        req.session.userName = data[0].name;
        res.redirect('/dashboard');
    }else{
        res.redirect('/login');
    }
});

router.post('/create', async (req, res) => {
    const { usr_name, mail, password } = req.body;

    const { data, error } = await supabase.from('users').select('*').eq('email',mail);

    if(data[0]){
        res.redirect('/login/create');
    }else{
        let newUserId;
        let isUnique = false;

        while(!isUnique){
            newUserId = "u" + Math.random().toString(36).substring(2);
            const { data, error } = await supabase.from('users').select('*').eq('userID',newUserId);
            if(!data[0]){
                isUnique = true;
            }
        }

        const { error } = await supabase.from('users').insert({ userID: newUserId, name: usr_name, email: mail, password: password });

        if(!error){
            req.session.userID = newUserId;
            req.session.userName = usr_name;
            res.redirect("/dashboard");
        }else{
            res.send("failed");
        }
    }
});

module.exports = router;
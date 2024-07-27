const express = require('express');
const router = express.Router();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get('/', async (req, res, next) => {
    const u_id = req.query.uid;
    if(!u_id){
        res.redirect('dashboard');
    }else if(u_id === req.session.userID){
        const { data: userData, error } = await supabase.from('users').select('*').eq('userID', u_id);
        res.render('edit-profile', { userData: userData });
    }else{
        const { data: userData, error } = await supabase.from('users').select('*').eq('userID', u_id);
        res.render('profile', { userData: userData });
    }
})

router.post('/edit-profile', async (req, res, next) => {
    const { name, userID } = req.body;
    const editUser = req.session.userID;
    if(userID === editUser){
        const { error } = await supabase.from('users').update({ name: name }).eq('userID', userID);
        res.redirect(`/profile?uid=${userID}`);
    }else{
        res.redirect('/dashboard');
    }
})
module.exports = router;
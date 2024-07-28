const express = require('express');
const router = express.Router();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { transliterate } = require('transliteration');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
        const { data: files, error: fileError } = await supabase.from('task_files').select('*').eq('taskID', t_id);

        const returnData = {
            projectData: projectData,
            taskData: taskData,
            comments: commentData,
            files: files
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
    if(!p_id || !t_id || !req.session.userID){
        res.redirect('/dashboard');
    }else{
        req.session.currentProject = p_id;
        req.session.currentTask = t_id;
        const { data: taskData, error } = await supabase.from('tasks').select('*').eq('taskID', t_id);
        const { data, _error } = await supabase.from('users').select('*');
        const namesOnly = data.map(user => ({ name: user.name }));
        res.render('edit_task', { taskData: taskData, users: namesOnly });
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

router.post('/delete-task', async (req, res, next) => {
    const taskID = req.body['taskID'];
    const { error } = await supabase.from('tasks').delete().eq('taskID', taskID);
    res.redirect(`/project?pid=${req.session.currentProject}`);
});

router.post('/upload-file', upload.single('taskFile'), async(req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }else if(!req.session.currentProject || !req.session.currentProject){
        return res.status(400).send('login before uploading');
    }

    p_id = req.session.currentProject;
    const { taskID } = req.body;
    let originalFileName = path.parse(req.file.originalname).base;

    originalFileName = transliterate(originalFileName);

    const sanitizedFileName = originalFileName.replace(/[^\w\-\.]+/g, '_');
    const fileName = `${taskID}_${sanitizedFileName}`;

    const { data: existingFile, error: existingFileError } = await supabase.storage.from('documents').list('', { prefix: fileName });

    if (existingFile && existingFile.length > 0) {
        const { error: deleteError } = await supabase.storage.from('documents').remove([fileName]);
    }

    const { data, error } = await supabase.storage.from('documents').upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    const fileUrl = `${supabaseUrl}/storage/v1/object/public/${data.fullPath}`;
    const { error: dbError } = await supabase.from('task_files').insert({ taskID: taskID , fileName: fileName , fileUrl: fileUrl });

    res.redirect(`/task?pid=${p_id}&tid=${taskID}`);
});

router.post('/delete-file', async (req, res, next) => {
    const { fileID } = req.body;
    if(!fileID){
        return res.status(400).send('try again');
    }else if(!req.session.currentProject || !req.session.currentProject){
        return res.status(400).send('login before uploading');
    }

    const { data: fileData, error: fileFetchError } = await supabase.from('task_files').select('fileName').eq('id', fileID).single();

    const fileName = fileData.fileName;

    const { error } = await supabase.storage.from('documents').remove([fileName]);

    const { _error } = await supabase.from('task_files').delete().eq('id', fileID);

    res.redirect(`/task?pid=${req.session.currentProject}&tid=${req.session.currentTask}`);
});
module.exports = router;
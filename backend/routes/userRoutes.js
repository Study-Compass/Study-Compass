const express = require('express');
const User = require('../schemas/user.js');
const Developer = require('../schemas/developer.js');
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const Classroom = require('../schemas/classroom.js');
const Schedule = require('../schemas/schedule.js');
const cron = require('node-cron');
const axios = require('axios');
const { isProfane } = require('../services/profanityFilterService'); 
const StudyHistory = require('../schemas/studyHistory.js'); 
const { findNext } = require('../helpers.js');
const { sendDiscordMessage } = require('../services/discordWebookService');

const router = express.Router();

router.post("/update-user", verifyToken, async (req, res) =>{
    const { name, username, classroom, recommendation, onboarded, darkModePreference } = req.body
    try{
        const user = await User.findById(req.user.userId);
        if (!user) {
            console.log(`POST: /update-user token is invalid`)
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.name = name ? name : user.name;
        user.username = username ? username : user.username;
        user.classroomPreferences  = classroom ? classroom : user.classroomPreferences;
        user.recommendationPreferences = recommendation ? recommendation : user.recommendationPreferences;
        user.onboarded = onboarded ? onboarded : user.onboarded;
        user.darkModePreference = darkModePreference ? darkModePreference : user.darkModePreference;
        
        await user.save();
        console.log(`POST: /update-user ${req.user.userId} successful`);
        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch(error){
        console.log(`POST: /update-user ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: error.message });
    }
});

// check if username is available
router.post("/check-username", verifyToken, async (req, res) =>{
    const { username } = req.body;
    const userId = req.user.userId;
    try{
        //check if username is taken, regardless of casing
        if(isProfane(username)){
            console.log(`POST: /check-username ${username} is profane`)
            return res.status(200).json({ success: false, message: 'Username does not abide by community standards' });
        }
        const reqUser = await User.findById(userId);
        const user = await User.findOne({ username: { $regex: new RegExp(username, "i") } });
        if(user && user._id.toString() !== userId){
            console.log(`POST: /check-username ${username} is taken`)
            return res.status(200).json({ success: false, message: 'Username is taken' });
        }
        console.log(`POST: /check-username ${username} is available`)
        return res.status(200).json({ success: true, message: 'Username is available' });
    } catch(error){
        console.log(`POST: /check-username ${username} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.post("/check-in", verifyToken, async (req, res) =>{
    const { classroomId } = req.body;
    try{
        //check if user is checked in elsewhere in the checked_in array
        const classrooms = await Classroom.find({checked_in: { $in: [req.user.userId] }});
        
        // const classrooms = await Classroom.find({ checkIns: req.user.userId });
        if(classrooms.length > 0){
            console.log(`POST: /check-in ${req.user.userId} is already checked in`)
            return res.status(400).json({ success: false, message: 'User is already checked in' });
        }
        const classroom = await Classroom.findOne({ _id: classroomId });
        classroom.checked_in.push(req.user.userId);
        await classroom.save();
        if(req.user.userId !== "65f474445dca7aca4fb5acaf"){
            sendDiscordMessage(`User check-in`,`user ${req.user.userId} checked in to ${classroom.name}`,"normal");
        }
        //create history object, preempt end time using findnext
        const schedule = await Schedule.findOne({ classroom_id: classroomId });
        if(schedule){
            let endTime = findNext(schedule.weekly_schedule); //time in minutes from midnight
            endTime = new Date(new Date().setHours(Math.floor(endTime/60), endTime%60, 0, 0));
            const history = new StudyHistory({
                user_id: req.user.userId,
                classroom_id: classroomId,
                start_time: new Date(),
                end_time: endTime
            });
            await history.save();
        }

        const io = req.app.get('io');
        io.to(classroomId).emit('check-in', { classroomId, userId: req.user.userId });

        console.log(`POST: /check-in ${req.user.userId} into ${classroom.name} successful`);
        return res.status(200).json({ success: true, message: 'Checked in successfully' });
    } catch(error){
        console.log(`POST: /check-in ${req.user.userId} failed`);
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.get("/checked-in", verifyToken, async (req, res) =>{
    try{
        const classrooms = await Classroom.find({ checked_in: { $in: [req.user.userId] } });
        console.log(`GET: /checked-in ${req.user.userId} successful`)
        return res.status(200).json({ success: true, message: 'Checked in classrooms retrieved', classrooms });
    } catch(error){
        console.log(`GET: /checked-in ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.post("/check-out", verifyToken, async (req, res) =>{
    const { classroomId } = req.body;
    try{
        const classroom = await Classroom.findOne({ _id: classroomId });
        classroom.checked_in = classroom.checked_in.filter(userId => userId !== req.user.userId);
        await classroom.save();
        const schedule = await Schedule.findOne({ classroom_id: classroomId });
        if(schedule){
            //find latest history object
            const history = await StudyHistory.findOne({ user_id: req.user.userId, classroom_id: classroomId }).sort({ start_time: -1 });
            const endTime = new Date();
            //if time spent is less than 5 minutes, delete history object
            if(history){
                const timeDiff = endTime - history.start_time;
                if(timeDiff < 300000){
                    await history.deleteOne();
                } else {
                    //else update end time
                    history.end_time = endTime;
                    await history.save();
                    //update user stats
                    const user = await User.findOne({ _id: req.user.userId });
                    user.hours += timeDiff/3600000;
                    //find if new classroom visited
                    const pastHistory = await StudyHistory.findOne({ user_id: req.user.userId, classroom_id: classroomId });
                    if(!pastHistory){
                        user.visited.push(classroomId);
                    }
                }
            }
        }
        const io = req.app.get('io');
        io.to(classroomId).emit('check-out', { classroomId, userId: req.user.userId });
        console.log(`POST: /check-out ${req.user.userId} from ${classroom.name} successful`);
        if(req.user.userId !== "65f474445dca7aca4fb5acaf"){
            sendDiscordMessage(`User check-out`,`user ${req.user.userId} checked out of ${classroom.name}`,"normal");
        }
        return res.status(200).json({ success: true, message: 'Checked out successfully' });
    } catch(error){
        console.log(`POST: /check-out ${req.user.userId} failed`);
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.get("/get-developer", verifyToken, async (req, res) =>{
    try{
        const developer = await Developer.findOne({ user_id: req.user.userId });
        console.log(`GET: /get-developer ${req.user.userId} successful`);
        if(!developer){
            return res.status(204).json({ success: false, message: 'Developer not found' });
        }
        return res.status(200).json({ success: true, message: 'Developer retrieved', developer });

    } catch(error){
        console.log(`GET: /get-developer ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.post("/update-developer", verifyToken, async (req, res) =>{
    const { type, commitment, goals, skills } = req.body;
    try{
        const developer = await Developer.findOne({ userId: req.user.userId });
        const user = await User.findById(req.user.userId);
        
        if(!developer){
            //craete developer
            const newDeveloper = new Developer({
                user_id: req.user.userId,
                name : user.name,
                type,
                commitment,
                goals,
                skills
            });
            await newDeveloper.save();
            user.developer = type;
            user.tags.push("developer");
            await user.save();
            console.log(`POST: /update-developer ${req.user.userId} successful`);
            return res.status(200).json({ success: true, message: 'Developer created successfully' });
        }
        developer.name = name ? name : developer.name;
        developer.type = type ? type : developer.type;
        developer.commitment = commitment ? commitment : developer.commitment;
        developer.goals = goals ? goals : developer.goals;
        developer.skills = skills ? skills : developer.skills;
        await developer.save();
        console.log(`POST: /update-developer ${req.user.userId} successful`);
        return res.status(200).json({ success: true, message: 'Developer updated successfully' });
    } catch(error){
        console.log(`POST: /update-developer ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.get("/get-user", async (req, res) =>{
    const userId = req.query.userId;
    try{
        const user = await User.findById(userId);
        console.log(`GET: /get-user ${req.query.userId} successful`);
        return res.status(200).json({ success: true, message: 'User retrieved', user });
    } catch(error){
        console.log(`GET: /get-user ${req.query.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

//route to get mulitple users, specified in array
router.get("/get-users", async (req, res) =>{
    const userIds = req.query.userIds;
    try{
        const users = await User.find({ _id: { $in: userIds } });
        console.log(`GET: /get-users ${req.query.userId} successful`);
        return res.status(200).json({ success: true, message: 'Users retrieved', users });
    } catch(error){
        console.log(`GET: /get-users ${req.query.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

module.exports = router;

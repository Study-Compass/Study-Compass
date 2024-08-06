const express = require('express');
const User = require('../schemas/user.js');
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const Classroom = require('../schemas/classroom.js');
const cron = require('node-cron');

const router = express.Router();

router.post("/update-user", verifyToken, async (req, res) =>{
    const { name, username, classroom, recommendation, onboarded } = req.body
    try{
        const user = await User.findById(req.user.userId); // Assuming Mongoose for DB operations
        if (!user) {
            console.log(`POST: /update-user token is invalid`)
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.name = name ? name : user.name;
        user.username = username ? username : user.username;
        user.classroomPreferences  = classroom ? classroom : user.classroomPreferences;
        user.recommendationPreferences = recommendation ? recommendation : user.recommendationPreferences;
        user.onboarded = onboarded ? onboarded : user.onboarded;
        
        await user.save();
        console.log(`POST: /update-user ${req.user.userId} successful`);
        return res.status(200).json({ success: true, message: 'User updated successfully' });
    } catch(error){
        console.log(`POST: /update-user ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: error.message });
    }
});

// check if username is available
router.post("/check-username", async (req, res) =>{
    const { username } = req.body;
    try{
        const user = await User.findOne({ username: username });
        if(user){
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
        //check if user is checked in elsewhere
        const classrooms = await Classroom.find({ checkIns: req.user.userId });
        if(classrooms.length > 0){
            console.log(`POST: /check-in ${req.user.userId} is already checked in`)
            return res.status(400).json({ success: false, message: 'User is already checked in' });
        }
        const classroom = Classroom.findOne({ _id: classroomId });
        classroom.checkIns.push(req.user.userId);
        await classroom.save();
        const checkoutTime = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours later
        cron.schedule(checkoutTime, async () => {
            classroom.checkIns = classroom.checkIns.filter(userId => userId !== req.user.userId);
            await classroom.save();
            console.log(`User ${req.user.userId} checked out of classroom ${classroom.name}`);
        });

        console.log(`POST: /check-in ${req.user.userId} into ${classroom.name} successful`)
        return res.status(200).json({ success: true, message: 'Checked in successfully' });
    } catch(error){
        console.log(`POST: /check-in ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

router.get("/checked-in", verifyToken, async (req, res) =>{
    try{
        const classrooms = await Classroom.find({ checkIns: req.user.userId });
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
        const classroom = Classroom.findOne({ _id: classroomId });
        classroom.checkIns = classroom.checkIns.filter(userId => userId !== req.user.userId);
        await classroom.save();
        console.log(`POST: /check-out ${req.user.userId} from ${classroom.name} successful`)
        return res.status(200).json({ success: true, message: 'Checked out successfully' });
    } catch(error){
        console.log(`POST: /check-out ${req.user.userId} failed`)
        return res.status(500).json({ success: false, message: 'Internal server error', error });
    }
});

module.exports = router;

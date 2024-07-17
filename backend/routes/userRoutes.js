const express = require('express');
const User = require('../schemas/user.js');
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');

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
        console.log(`POST: /update-user ${req.user.userId} successful`)
    } catch(error){

    }
});

module.exports = router;

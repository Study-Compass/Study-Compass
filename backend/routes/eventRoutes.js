const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const Event = require('../schemas/event');
const User = require('../schemas/user');
const Classroom = require('../schemas/classroom');

router.post('/create-event', verifyToken, async (req, res) => {
    const { name, type, hosting, location, date, description, image, classroom_id } = req.body;
    const user_id = req.user.userId;

    const event = new Event({
        name,
        type,
        hosting : user_id,
        hostingType : 'User',
        location,
        date,
        description,
        image,
        classroom_id
    });
    try {
        await event.save();
        res.status(201).json({
            success: true,
            message: 'Event created successfully.'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events created by the user
router.get('/get-events', verifyToken, async (req, res) => {
    const user_id = req.user.userId;

    try {
        const events = await Event.find({ user_id }).populate('classroom_id');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events
router.get('/get-all-events', verifyTokenOptional, async (req, res) => {
    try {
        // const events = await Event.find({}).populate('classroom_id');
        //get all events, attach user object to the event
        const events = await Event.find({}).populate('classroom_id').populate('hosting_id');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events in a classroom
router.get('/get-classroom-events/:classroom_id', verifyTokenOptional, async (req, res) => {
    const { classroom_id } = req.params;

    try {
        const events = await Event.find({ classroom_id }).populate('classroom_id');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events user is going to
router.get('/get-going-events', verifyToken, async (req, res) => {
    const user_id = req.user.userId;

    try {
        const user = await User.findById(user_id);
        const events = await Event.find({ _id: { $in: user.going } }).populate('classroom_id');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// delete event
router.delete('/delete-event/:event_id', verifyToken, async (req, res) => {
    const { event_id } = req.params;
    const user_id = req.user.userId;

    try {
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        if (event.user_id.toString() !== user_id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this event.'
            });
        }

        await Event.deleteOne({ _id: event_id });
        res.status(200).json({
            success: true,
            message: 'Event deleted successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



module.exports = router;


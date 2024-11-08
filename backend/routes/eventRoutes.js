const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const Event = require('../schemas/event');
const User = require('../schemas/user');
const Classroom = require('../schemas/classroom');
const OIEStatus = require('../schemas/OIE');

router.post('/create-event', verifyToken, async (req, res) => {
    const user_id = req.user.userId;

    const event = new Event({
        ...req.body,
        hostingId : user_id,
        hostingType : 'User',

    });
    
    let OIE = null;

    if (event.expectedAttendance > 200 || event.OIEAcknowledgementItems && event.OIEAcknowledgementItems.length > 0) {
        event.OIEStatus = "Pending";
        OIE = new OIEStatus({
            eventRef: event._id,
            status: 'Pending',
            checkListItems: event.OIEAcknowledgementItems
        });
    }

    try {
        await event.save();
        if (OIE) {
            await OIE.save();
        }
        console.log('POST: /create-event successful');
        res.status(201).json({
            success: true,
            message: 'Event created successfully.'
        });
    } catch (error) {
        console.log('POST: /create-event failed', error);
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
        console.log('GET: /get-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-events failed', error);
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
        //mkae sure event doesn't have rejected or pending status
        const events = await Event.find({ OIEStatus: { $nin: ['Rejected', 'Pending'] } }).populate('classroom_id');
        console.log('GET: /get-all-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-all-events failed', error);
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

//get all oie-unapproved events
router.get('/oie/get-pending-events', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.admin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this page.'
            });
        }
        const events = await Event.find({ OIEStatus: 'Pending' }).populate('classroom_id').populate('hostingId');
        console.log('GET: /oie/get-pending-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /oie/get-pending-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});



module.exports = router;


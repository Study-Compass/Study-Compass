const express = require('express');
const Classroom = require('../schemas/classroom.js');
const Schedule = require('../schemas/schedule.js');
const Rating = require('../schemas/rating.js');
const User = require('../schemas/user.js');
const Report = require('../schemas/report.js');
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const { sortByAvailability } = require('../helpers.js');
const multer = require('multer');
const path = require('path');
const s3 = require('../aws-config');
const mongoose = require('mongoose');
const { clean } = require('../services/profanityFilterService');


const router = express.Router();

// Route to get a specific classroom by name
router.get('/getroom/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        
        // Handle special case where "none" is passed as a room name
        if(roomId === "none"){
            // Return an empty Classroom object
            res.json({ success: true, message: "Empty room object returned",room: {name:null},  data: new Schedule() });
                console.log(`GET: /getroom/none`);
            return;
        }

        // Find the classroom by name
        const room = await Classroom.findOne({ _id: roomId });
        const schedule = await Schedule.findOne({ classroom_id: roomId });
        console.log(`GET: /getroom/${roomId}`);
        if (schedule) {
            // If the room exists, return it
            res.json({ success: true, message: "Room found", room: room, data: schedule });
        } else {
            // If not found, return a 404 with a message
            res.status(404).json({ success: false, message: 'Room not found' });
        }
    } catch (error) {
        // Handle any errors that occur during the process
        res.status(500).json({ success: false, message: 'Error retrieving room', error: error.message });
    }
});

// Route to get all classroom names
router.get('/getrooms', async (req, res) => {
    try {
        // Fetch all classrooms and only select their names
        const allRooms = await Classroom.find({}).select('name _id');
        const roomDict = allRooms.reduce((acc, room) => {
            acc[room.name] = room._id.toString(); // Convert ObjectId to string if necessary
            return acc;
        }, {});

        // Return the sorted list of classroom names
        res.json({ success: true, message: "All room names fetched", data: roomDict });
    } catch (error) {
        // Handle any errors that occur during the fetch
        res.status(500).json({ success: false, message: 'Error fetching room names', error: error.message });
    }
});

// Route to find classrooms available during given free periods
router.post('/free', async (req, res) => {
    const freePeriods = req.body.query; // Assuming the input object is in the request body
    
    // Helper function to create MongoDB query conditions for given free periods
    const createTimePeriodQuery = (queryObject) => {
        let conditions = [];
        Object.entries(queryObject).forEach(([day, periods]) => {
            if(periods.length > 0){
                periods.forEach(period => {
                    const condition = {
                        [`weekly_schedule.${day}`]: {
                            "$not": {
                                "$elemMatch": {
                                    "start_time": { "$lt": period.end_time },
                                    "end_time": { "$gt": period.start_time }
                                }
                            }
                        }
                    };
                    conditions.push(condition);
                });
            }
        });
        return conditions;
    };

    try {
        const queryConditions = createTimePeriodQuery(freePeriods);
        const mongoQuery = { "$and": queryConditions };

        // Query the database with constructed conditions
        const rooms = await Schedule.find(mongoQuery);
        const roomIds = rooms.map(room => room.classroom_id);

        // Fetch the names of the rooms that are free
        const names = await Classroom.find({ _id: { "$in": roomIds } }).select('name -_id');
        const roomNames = names.map(room => room.name);
        console.log(`POST: /free`, freePeriods);
        // Return the names of rooms that are free during the specified periods
        res.json({ success: true, message: "Rooms available during the specified periods", data: roomNames });
    } catch (error) {
        // Handle any errors during database query
        res.status(500).json({ success: false, message: 'Error finding free rooms', error: error.message });
    }
});

router.post('/getbatch', async (req, res) => {
    const queries = req.body.queries;
    const exhaustive = req.body.exhaustive; // Option to retrieve just schedule data or both schedule and room data
    let data = [];

    console.log(`POST: /getbatch`, JSON.stringify(req.body.queries));
    
    try {
        const results = await Promise.all(queries.map(async (query, index) => {
            if (query === "none") {
                // Use null or a specific structure to indicate early break, handle it later
                return { index, result: { data: new Schedule() }};
            }

            let result = { room: "not found", data: "not found" };
            if (exhaustive) {
                const room = await Classroom.findOne({ _id: query });
                result.room = room ? room : "not found";
            }

            const schedule = await Schedule.findOne({ classroom_id: query });
            result.data = schedule ? schedule : "not found";
            if(result.room === "not found" && result.data === "not found"){
                return null;
            }
            // Attach the index to each result
            return { index, result };
        }));

        const filteredResults = results.filter(result => result !== null && result !== undefined);
        // Sort results based on the original index to ensure order
        const sortedResults = filteredResults.sort((a, b) => a.index - b.index).map(item => item.result);

        // Send response after all operations are done and results are sorted
        res.json({ success: true, message: "Rooms found", data: sortedResults });
    } catch (error) {
        // Check if it's a special case to stop the process early
        if (error.message === "noneQueryFound") {
            return res.json({ success: true, message: "Empty query processed", rooms: {}, schedules: {} });
        }
        // If not, it's a real error
        return res.status(500).json({ success: false, message: 'Error retrieving data', error: error.message });
    }
});



router.get('/get-recommendation', verifyTokenOptional, async (req, res) => {
    const userId = req.user ? req.user.userId : null;
    try {
        let user;
        let randomClassroom;
        const currentTime = new Date();
        const days = ['X', 'M', 'T', 'W', 'R', 'F', 'X']; // You might need to handle weekends more explicitly
        const day = days[currentTime.getDay()];
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();
        const time = hour * 60 + minute;
        console.log(`day: ${day}`);
        let query;
        if (userId) {
            user = await User.findOne({ _id: userId });
            const savedClassrooms = user.saved.map(id => new mongoose.Types.ObjectId(id)); // Ensure ObjectId for classroom IDs
            // const savedClassrooms = user.saved; 
            if (day === 'X') {
                query = {
                    classroom_id: { $in: savedClassrooms }
                };
            } else {
                query = {
                    [`weekly_schedule.${day}`]: {
                        $not:{
                            $elemMatch: { start_time: { $lt: time }, end_time: { $gt: time } }
                        }                    
                    },
                    classroom_id: { $in: savedClassrooms }
                };
            }

            randomClassroom = await Schedule.aggregate([
                { $match: query },
                { $sample: { size: 1 } }
            ]);

            if (randomClassroom && randomClassroom.length > 0) {
                randomClassroom = randomClassroom[0];
                randomClassroom = await Classroom.findOne({ _id: randomClassroom.classroom_id });
                console.log(`GET: /get-recommendation/${userId}`);
                return res.status(200).json({ success: true, message: 'Recommendation found', data: randomClassroom });
            }
        }

        // If no user or no saved classrooms, return a random classroom that is free
        if (day === 'X') {
            query = {};  // Weekend fallback
        } else {
            query = {
                [`weekly_schedule.${day}`]: {
                    $not:{
                        $elemMatch: { start_time: { $lt: time }, end_time: { $gt: time } }
                    }
                }
            };
        }
        randomClassroom = await Schedule.aggregate([
            { $match: query },
            { $sample: { size: 1 } }
        ]);

        if (randomClassroom && randomClassroom.length > 0) {
            randomClassroom = randomClassroom[0];
            randomClassroom = await Classroom.findOne({ _id: randomClassroom.classroom_id });
            console.log(`GET: /get-recommendation`);
            return res.status(200).json({ success: true, message: 'Recommendation found', data: randomClassroom });
        }

        console.log(`GET: /get-recommendation`);
        return res.status(404).json({ success: false, message: 'No recommendations found' });
    } catch (error) {
        console.log(`GET: /get-recommendation failed`, error);
        return res.status(500).json({ success: false, message: 'Error finding user', error: error.message });
    }
});


module.exports = router;

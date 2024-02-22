const express = require('express');
const Classroom = require('./schemas/classroom.js');

const router = express.Router();

// Route to get a specific classroom by name
router.get('/getroom/:name', async (req, res) => {
    try {
        const roomName = req.params.name;
        
        // Handle special case where "none" is passed as a room name
        if(roomName === "none"){
            // Return an empty Classroom object
            res.json({ success: true, message: "Empty room object returned", data: new Classroom() });
                console.log(`GET: /getroom/${roomName}`);
            return;
        }

        // Find the classroom by name
        const room = await Classroom.findOne({ name: roomName });
        console.log(`GET: /getroom/${roomName}`);

        if (room) {
            // If the room exists, return it
            res.json({ success: true, message: "Room found", data: room });
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
        const allRooms = await Classroom.find({}).select('name -_id');
        const roomNames = allRooms.map(room => room.name);

        // Return the sorted list of classroom names
        res.json({ success: true, message: "All room names fetched", data: roomNames.sort() });
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
        const rooms = await Classroom.find(mongoQuery);
        const roomNames = rooms.map(room => room.name);

        // Return the names of rooms that are free during the specified periods
        res.json({ success: true, message: "Rooms available during the specified periods", data: roomNames });
    } catch (error) {
        // Handle any errors during database query
        res.status(500).json({ success: false, message: 'Error finding free rooms', error: error.message });
    }
});

module.exports = router;

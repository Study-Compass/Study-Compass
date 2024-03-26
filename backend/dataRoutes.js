const express = require('express');
const Classroom = require('./schemas/classroom.js');
const Schedule = require('./schemas/schedule.js');
const User = require('./schemas/user.js');

const router = express.Router();

// Route to get a specific classroom by name
router.get('/getroom/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        
        // Handle special case where "none" is passed as a room name
        if(roomId === "none"){
            // Return an empty Classroom object
            res.json({ success: true, message: "Empty room object returned", data: new Schedule() });
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

            // Attach the index to each result
            return { index, result };
        }));

        // Sort results based on the original index to ensure order
        const sortedResults = results.sort((a, b) => a.index - b.index).map(item => item.result);

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
router.post('/changeclassroom', async (req, res) => {
    const id = req.body.id;
    const attributes = req.body.attributes;
    const imageUrl = req.body.imageUrl;

    try{
        const classroom = await Classroom.findOne({_id: id});

        if (!classroom) {
            return res.status(404).json({ success: false, message: "Classroom not found" });
        }
        if(imageUrl !== ""){
            classroom.image = `/classrooms/${imageUrl}`;
        }
        classroom.attributes = attributes;
        await classroom.save();
        console.log(`POST: /changeclassroom/${id}`);
        res.json({ success: true, message: "Room changed" });
    } catch (error) {
        res.status(500).json({success: false, message: 'Error changing data', error: error.message });
    }
});

router.get('/search', async (req, res) => {
    const query = req.query.query;
    const attributes = req.query.attributes ? req.query.attributes.split(",") : []; // Ensure attributes is an array
    const sort = req.query.sort;

    try {
        // Define the base query with projection to only include the name field
        let findQuery = Classroom.find(
            { name: { $regex: query, $options: 'i' }, attributes: { $all: attributes } },
            { name: 1, _id: 0 } // Project only the name field
        );

        if(attributes.length === 0){
            findQuery = Classroom.find(
                { name: { $regex: query, $options: 'i' }},
                { name: 1, _id: 0 } // Project only the name field
            );
        }

        console.log({ name: { $regex: query, $options: 'i' }, attributes: { $all: attributes } },{ name: 1, _id: 0 }) 


        // Conditionally add sorting if required
        if (sort === "name") {
            findQuery = findQuery.sort('name'); // Sort by name in ascending order
        }

        // Execute the query
        const classrooms = await findQuery;

        // Extract only the names from the result set
        const names = classrooms.map(classroom => classroom.name);

        console.log(`GET: /search?query=${query}&attributes=${attributes}&sort=${sort}`);
        res.json({ success: true, message: "Rooms found", data: names });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching for rooms', error: error.message });
    }
});

// Route to save a classroom to a user's saved list, expects a room and user ID
router.post('/save', async (req, res) => {
    const roomId = req.body.roomId;
    const userId = req.body.userId;
    const operation = req.body.operation; // true is add, false is remove

    try {
        const classroom = await Classroom.findOne({ _id: roomId });
        if (!classroom) {
            console.log(`POST: /save/${roomId}/${userId} failed`);
            return res.status(404).json({ success: false, message: "Classroom not found" });
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
            console.log(`POST: /save/${roomId}/${userId} failed`);
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (operation && user.saved.includes(classroom._id)) {
            console.log(`POST: /save/${roomId}/${userId} failed`);
            return res.status(409).json({ success: false, message: "Room already saved" });
        }
        if (!operation && !user.saved.includes(classroom._id)) {
            console.log(`POST: /save/${roomId}/${userId} failed`);
            return res.status(409).json({ success: false, message: "Room not saved" });
        }
        if (!operation) {
            user.saved = user.saved.filter(id => id !== roomId);
            await user.save();
            console.log(`POST: /save/${roomId}/${userId}`);
            return res.json({ success: true, message: "Room removed" });
        } else {
            user.saved.push(roomId);
            await user.save();
            console.log(`POST: /save/${roomId}/${user}`);
            res.json({ success: true, message: "Room saved" });
        }
    } catch (error) {
        console.log(`POST: /save/${roomId}/${userId} failed`);
        res.status(500).json({ success: false, message: 'Error saving room', error: error.message });
    }
});

module.exports = router;

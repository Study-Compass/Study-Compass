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

router.get('/search', verifyTokenOptional, async (req, res) => {
    const query = req.query.query;
    const attributes = req.query.attributes ? req.query.attributes : []; // Ensure attributes is an array
    const sort = req.query.sort;
    const userId = req.user ? req.user.userId : null;
    console.log('sort', sort);
    let user;
    if(userId){
        try{
            user = await User.findOne({ _id: userId });
        } catch(error) {
            console.log('invalid user')
        }
    }

    try {
        // Define the base query with projection to only include the name field
        let findQuery = Classroom.find(
            { name: { $regex: query, $options: 'i' }, attributes: { $all: attributes } },
            { name: 1 } // Project only the name field
        );

        if(attributes.length === 0){
            findQuery = Classroom.find(
                { name: { $regex: query, $options: 'i' }},
                { name: 1 } // Project only the name field
            );
        }

        if(sort === "availability"){
            findQuery =  Classroom.aggregate([
                {
                    $match: {
                        name: { $regex: query, $options: 'i' } // Filters classrooms by name using regex
                    }
                },
                {
                    $lookup: {
                        from: "schedules", // Assumes "schedules" is the collection name
                        localField: "_id", // Field in the 'classroom' documents
                        foreignField: "classroom_id", // Corresponding field in 'schedule' documents
                        as: "schedule_info" // Temporarily holds the entire joined schedule documents
                    }
                },
                {
                    $unwind: "$schedule_info" // Unwinds the schedule_info to handle multiple documents if necessary
                },
                {
                    $project: {
                        name: 1, // Includes classroom name in the output
                        weekly_schedule: "$schedule_info.weekly_schedule" // Projects only the weekly_schedule part from each schedule_info
                    }
                }
            ]);
        }

        console.log({ name: { $regex: query, $options: 'i' }, attributes: { $all: attributes } },{ name: 1} ) 


        // Conditionally add sorting if required
        findQuery = findQuery.sort('name'); // Sort by name in ascending order

        // Execute the query
        let classrooms = await findQuery;

        if(sort === "availability"){
            classrooms = sortByAvailability(classrooms);
            // console.log(classrooms);
        }

        let sortedClassrooms = [];

        if (userId && user) {
            const savedSet = new Set(user.saved); // Convert saved items to a Set for efficient lookups

            // Split classrooms into saved and not saved
            const { saved, notSaved } = classrooms.reduce((acc, classroom) => {
                if (savedSet.has(classroom._id.toString())) { 
                    acc.saved.push(classroom);
                } else {
                    acc.notSaved.push(classroom);
                }
                return acc;
            }, { saved: [], notSaved: [] });

            // Concatenate saved items in front of not saved items
            sortedClassrooms = saved.concat(notSaved);
        } else {
            sortedClassrooms = classrooms; // No user or saved info, use original order
        }

        // Extract only the names from the result set
        const names = sortedClassrooms.map(classroom => classroom.name);

        console.log(`GET: /search?query=${query}&attributes=${attributes}&sort=${sort}`);
        res.json({ success: true, message: "Rooms found", data: names });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching for rooms', error: error.message });
        console.error(error);
    }
});

router.get('/all-purpose-search', verifyTokenOptional, async (req, res) => {
    const query = req.query.query;
    const attributes = req.query.attributes ? req.query.attributes : []; // Ensure attributes is an array
    const timePeriod = req.query.timePeriod; // might be null
    const sort = req.query.sort;
    const userId = req.user ? req.user.userId : null;
    let user;
    console.log(`GET: /all-purpose-search?query=${query}&attributes=${attributes}&sort=${sort}&time=${timePeriod}`);

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

    if(userId){
        try{
            user = await User.findOne({ _id: userId });
        } catch(error) {
            console.log('invalid user')
        }
    }

    try {
        // Define the base query with projection to only include the name field
        let findQuery = Classroom.find(
            { name: { $regex: query, $options: 'i' }, attributes: { $all: attributes },  mainSearch: { $ne: false } },
            { name: 1 } // Project only the name field
        );

        if(attributes.length === 0){
            findQuery = Classroom.find(
                { name: { $regex: query, $options: 'i' },  mainSearch: { $ne: false }},
                { name: 1 } // Project only the name field
            );
        }

        if(timePeriod){
            const queryConditions = createTimePeriodQuery(timePeriod);
            const mongoQuery = { "$and": queryConditions };
            const rooms = await Schedule.find(mongoQuery);
            const roomIds = rooms.map(room => room.classroom_id); //add condition to findQuery
            findQuery = findQuery.where('_id').in(roomIds);
        }

        if(sort === "availability"){
            findQuery =  Classroom.aggregate([
                {
                    $match: {
                        name: { $regex: query, $options: 'i' }, // Filters classrooms by name using regex
                        mainSearch: { $ne: false }
                    }
                },
                {
                    $lookup: {
                        from: "schedules", 
                        localField: "_id", 
                        foreignField: "classroom_id", // Corresponding field in 'schedule' documents
                        as: "schedule_info" // Temporarily holds the entire joined schedule documents
                    }
                },
                {
                    $unwind: "$schedule_info" // Unwinds the schedule_info to handle multiple documents if necessary
                },
                {
                    $project: {
                        name: 1, // Includes classroom name in the output
                        weekly_schedule: "$schedule_info.weekly_schedule" // Projects only the weekly_schedule part from each schedule_info
                    }
                }
            ]);
        }

        findQuery = findQuery.sort('name'); 

        let classrooms = await findQuery;

        if(sort === "availability"){
            classrooms = sortByAvailability(classrooms);
            // console.log(classrooms);
        }

        let sortedClassrooms = [];

        if (userId && user) {
            if(sort === "availability"){
                return;
            }
            const savedSet = new Set(user.saved); // Convert saved items to a Set for efficient lookups

            // Split classrooms into saved and not saved
            const { saved, notSaved } = classrooms.reduce((acc, classroom) => {
                if (savedSet.has(classroom._id.toString())) { 
                    acc.saved.push(classroom);
                } else {
                    acc.notSaved.push(classroom);
                }
                return acc;
            }, { saved: [], notSaved: [] });

            // Concatenate saved items in front of not saved items
            sortedClassrooms = saved.concat(notSaved);
        } else {
            sortedClassrooms = classrooms; // No user or saved info, use original order
        }

        // Extract only the names from the result set
        const names = sortedClassrooms.map(classroom => classroom.name);

        res.json({ success: true, message: "Rooms found", data: names });

        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching for rooms', error: error.message });
        console.error(error);
    }
});

// Route to save a classroom to a user's saved list, expects a room and user ID
router.post('/save', verifyToken, async (req, res) => {
    const roomId = req.body.roomId;
    const userId = req.user.userId;
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


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

router.post('/upload-image/:classroomName', upload.single('image'), async (req, res) => {
  const classroomName = req.params.classroomName;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${classroomName}/${Date.now()}_${path.basename(file.originalname)}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read', // Make the file publicly accessible
  };

  try {
    // Upload image to S3
    const s3Response = await s3.upload(s3Params).promise();
    const imageUrl = s3Response.Location;

    // Find the classroom and update the image attribute
    const classroom = await Classroom.findOneAndUpdate(
      { name: classroomName },
      { image: imageUrl },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Image uploaded and classroom updated.', classroom });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while uploading the image or updating the classroom.');
  }
});

// Route to get all number of ratings and average for Classroom 
router.post('/average_rating', verifyToken, async (req, res) => {
    const classroomId = req.body.classroomId;
    const userId = req.body.userId;

    try {
        //get all ratings
        const ratings = await Rating.find({ classroom_id: classroomId });
        if (ratings.length === 0) {
            return res.status(404).json({ success: false, message: 'No ratings found for this classroom' });
        }

        const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
        const averageScore = totalScore / ratings.length;

        res.json({ success: true, average_rating: averageScore, number_of_ratings: ratings.length });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching for average ratings', error: error.message });
    }
    
});

// Route to update rating to Classroom Schema
router.post('/update_rating', verifyToken, async (req, res) => {
    const { classroomId, userId, comment, score, upvotes, downvotes } = req.body;

    try {
        let rating = await Rating.findOne({ classroom_id: classroomId, user_id: userId });

        if (rating) {
            rating.comment = comment;
            rating.score = score;
            rating.upvotes = upvotes;
            rating.downvotes = downvotes;
            await rating.save();
        } else {
            rating = new Rating({
                classroom_id: classroomId,
                user_id: userId,
                comment,
                score,
                upvotes,
                downvotes
            });
            await rating.save();
        }

        const ratings = await Rating.find({ classroom_id: classroomId });
        const totalScore = ratings.reduce((sum, rating) => sum + rating.score, 0);
        const averageScore = totalScore / ratings.length;

        const classroom = await Classroom.findOne({ _id: classroomId });
        if (classroom) {
            classroom.number_of_ratings = ratings.length;
            classroom.average_rating = averageScore;
            await classroom.save();
        } else {
            console.log(`POST: /update_rating/${classroomId}/${userId} failed`);
            res.status(500).json({ success: false, message: 'Classroom does not exist'});
        }

        console.log(`POST: /update_rating/${classroomId}/${userId} successful`);
        res.status(200).json({ success: true, message: 'Successfully updated rating', data: {score: averageScore, num_ratings:ratings.length} });
    } catch (error) {
        console.error(error);
        console.log(`POST: /update_rating/${classroomId}/${userId} faled`);
        res.status(500).json({ success: false, message: 'Error updating or retrieving ratings', error: error.message });
    }
});

router.get('/get-user-ratings', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try{
        const ratings = await Rating.find({ user_id: userId });
        console.log(`POST: /get-user-ratings/${userId}`);
        res.json({ success: true, message: "Ratings fetched", data: ratings });
    } catch(error){
        console.log(`POST: /get-user-ratings/${userId} failed`);
        return res.status(500).json({ success: false, message: 'Error finding user', error: error.message});
    }
});

router.get('/user-rated', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const classroomId = req.query.classroomId;
    try{
        const rating = await Rating.findOne({ user_id: userId, classroom_id: classroomId });
        if(!rating){
            res.json({ success: true, message: "Rating not found", data: null });
            return;
        }
        console.log(`GET: /user-rated/${userId}/${classroomId}`);
        res.json({ success: true, message: "Rating found", data: rating });
    } catch(error){
        console.log(`GET: /user-rated/${userId}/${classroomId} failed`);
        return res.status(500).json({ success: false, message: 'Error finding rating', error: error.message});
    }

});

router.get('/get-ratings', async (req, res) => {
    const classroomId = req.query.classroomId;
    try{
        const ratings = await Rating.find({ classroom_id: classroomId });
        console.log(`GET: /get-ratings/${classroomId}`);
        res.json({ success: true, message: "Ratings fetched", data: ratings });
    } catch(error){
        console.log(`GET: /get-ratings/${classroomId} failed`);
        return res.status(500).json({ success: false, message: 'Error finding ratings', error: error.message});
    }
});

router.post('/send-report', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const report = req.body.report;
    const type = req.body.type;
    try{
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        //store report in mongo
        await Report.create({ user_id: userId, type: type, report: report });
        console.log(`POST: /send-report/${userId}`);
        res.json({ success: true, message: "Report saved" });
    } catch(error){
        return res.status(500).json({ success: false, message: 'Error finding user', error: error.message});
    }
});

router.post('/main-search-change', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const classroomId = req.body.classroomId;
    try{
        const user = await User.findOne({ _id: userId });
        if (!user) {
            console.log(`POST: /main-search-change/${userId} failed`);
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if(!user.admin){
            console.log(`POST: /main-search-change/${userId} failed`);
            return res.status(403).json({ success: false, message: "User not authorized" });
        }
        const classroom = await Classroom.findOne({ _id: classroomId });
        if (!classroom) {
            console.log(`POST: /main-search-change/${userId} failed`);
            return res.status(404).json({ success: false, message: "Classroom not found" });
        }
        classroom.mainSearch = !classroom.mainSearch;
        await classroom.save();
        console.log(`POST: /main-search-change/${userId}`);
        res.json({ success: true, message: "Main search changed" });
    } catch(error){
        return res.status(500).json({ success: false, message: 'Error finding user', error: error.message});
    }
});


module.exports = router;

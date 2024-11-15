const express = require('express');
const router = express.Router();
const { isValid, formatISO, parseISO, setHours, startOfWeek, endOfWeek, setMinutes, setSeconds, setMilliseconds, eachHourOfInterval, eachDayOfInterval } = require('date-fns');
const Visit = require('../schemas/visit'); 
const User = require('../schemas/user');
const QR = require('../schemas/qr');
const RepeatedVisit = require('../schemas/repeatedVisit');
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');


// Route to log a visit
router.post('/log-visit', async (req, res) => {
    try {
        const visit = new Visit({ timestamp: new Date() });
        await visit.save();
        res.status(200).json({ message: 'Visit logged' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to log visit' });
    }
});

router.post('/log-repeated-visit', verifyTokenOptional, async (req, res) => {
    const { hash } = req.body;
    try {
        console.log('Logging repeated visit');
        let repeatedVisit = await RepeatedVisit.findOne({hash: hash});
        if(!repeatedVisit){
            repeatedVisit = new RepeatedVisit({ visits: [new Date()], hash: hash, user_id: req.user ? req.user._id : null });
        }
        repeatedVisit.visits.push(new Date());
        await repeatedVisit.save();
        console.log('Repeated visit logged');
        res.status(200).json({ message: 'Visit logged' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to log visit' });
    }
});

router.get('/visits-by-day', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate the dates
        if (!startDate || !isValid(parseISO(startDate))) {
            return res.status(400).json({ error: 'Invalid startDate' });
        }

        const parsedStartDate = parseISO(startDate);
        const parsedEndDate = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : new Date();

        const startOfWeekDate = startOfWeek(parsedStartDate, { weekStartsOn: 0 }); // 1 = Monday
        const endOfWeekDate = endOfWeek(parsedStartDate, { weekStartsOn: 0 });        //print for debugging


        // Query visits within the week range and group by day
        const visitsByDay = await Visit.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: startOfWeekDate,
                        $lt: endOfWeekDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Generate an array with all days within the week range
        const daysInRange = eachDayOfInterval({
            start: startOfWeekDate,
            end: endOfWeekDate,
        });

        // Format and pad the result
        const formattedResult = daysInRange.map((day) => {
            const formattedDate = formatISO(day, { representation: 'date' });

            // Find the matching day in the database result
            const visitForDay = visitsByDay.find(item =>
                item._id.year === day.getFullYear() &&
                item._id.month === day.getMonth() + 1 &&
                item._id.day === day.getDate()
            );

            // Return either the actual count or 0 if there was no visit for this day
            return {
                date: formattedDate,
                count: visitForDay ? visitForDay.count : 0
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching visits by day' });
    }
});

// `/visits-by-hour` route: Fetches visits grouped by hour within the specified range and pads missing hours with 0 visits
router.get('/visits-by-hour', async (req, res) => {
    try {
        const { startDate } = req.query;

        // Validate the startDate
        if (!startDate || !isValid(parseISO(startDate))) {
            return res.status(400).json({ error: 'Invalid startDate' });
        }

        const parsedDate = parseISO(startDate);

        // Define the start and end of the day explicitly using setHours, setMinutes, etc.
        const startOfDay = setMilliseconds(setSeconds(setMinutes(setHours(parsedDate, 0), 0), 0), 0); // 00:00 of the given day
        const endOfDay = setMilliseconds(setSeconds(setMinutes(setHours(parsedDate, 23), 59), 59), 999); // 23:59:59.999 of the same day
        // Query visits within the day range and group by hour
        const visitsByHour = await Visit.aggregate([
            {
                $match: {
                    timestamp: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" },
                        hour: { $hour: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1
                }
            }
        ]);

        // Generate an array with all hours from 00:00 to 23:00
        const hoursInRange = eachHourOfInterval({
            start: startOfDay,
            end: endOfDay
        });

        // Format and pad the result
        const formattedResult = hoursInRange.map((hour) => {
            const formattedHour = `${hour.getFullYear()}-${String(hour.getMonth() + 1).padStart(2, '0')}-${String(hour.getDate()).padStart(2, '0')} ${String(hour.getHours()).padStart(2, '0')}:00`;

            // Find the matching hour in the database result
            const visitForHour = visitsByHour.find(item =>
                item._id.year === hour.getFullYear() &&
                item._id.month === hour.getMonth() + 1 &&
                item._id.day === hour.getDate() &&
                item._id.hour === hour.getHours()
            );

            // Return either the actual count or 0 if there was no visit for this hour
            return {
                hour: formattedHour,
                count: visitForHour ? visitForHour.count : 0
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching visits by hour' });
    }
});


router.get('/visits-by-all', async (req, res) => {
    try {
        // Query to get the earliest and latest visit dates for padding the result
        const firstVisit = await Visit.findOne().sort({ timestamp: 1 });
        const lastVisit = await Visit.findOne().sort({ timestamp: -1 });

        if (!firstVisit || !lastVisit) {
            return res.json([]); // No visits in the database
        }

        // Get the date range (from the first to the last visit)
        const startDate = new Date(firstVisit.timestamp);
        const endDate = new Date(lastVisit.timestamp);

        // Query to get all visits within the range, grouped by day
        const visitsByAll = await Visit.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" },
                        day: { $dayOfMonth: "$timestamp" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Generate an array with all days in the date range
        const daysInRange = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        // Format and pad the result
        const formattedResult = daysInRange.map((day) => {
            const formattedDate = formatISO(day, { representation: 'date' });

            // Find the matching day in the database result
            const visitForDay = visitsByAll.find(item =>
                item._id.year === day.getFullYear() &&
                item._id.month === day.getMonth() + 1 &&
                item._id.day === day.getDate()
            );

            // Return either the actual count or 0 if there was no visit for this day
            return {
                date: formattedDate,
                count: visitForDay ? visitForDay.count : 0
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching all-time visits' });
    }
});

router.get('/users-by-day', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Validate the dates
        if (!startDate || !isValid(parseISO(startDate))) {
            return res.status(400).json({ error: 'Invalid startDate' });
        }

        const parsedStartDate = parseISO(startDate);
        const parsedEndDate = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : new Date();

        const startOfWeekDate = startOfWeek(parsedStartDate, { weekStartsOn: 0 }); // 0 = Sunday
        const endOfWeekDate = endOfWeek(parsedStartDate, { weekStartsOn: 0 });

        // Query users created within the week range and group by day
        const usersByDay = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfWeekDate,
                        $lt: endOfWeekDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Generate an array with all days within the week range
        const daysInRange = eachDayOfInterval({
            start: startOfWeekDate,
            end: endOfWeekDate,
        });

        // Format and pad the result
        const formattedResult = daysInRange.map((day) => {
            const formattedDate = formatISO(day, { representation: 'date' });

            // Find the matching day in the database result
            const userForDay = usersByDay.find(item =>
                item._id.year === day.getFullYear() &&
                item._id.month === day.getMonth() + 1 &&
                item._id.day === day.getDate()
            );

            // Return either the actual count or 0 if there was no user created on this day
            return {
                date: formattedDate,
                count: userForDay ? userForDay.count : 0
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching users by day' });
    }
});

router.get('/users-by-hour', async (req, res) => {
    try {
        const { startDate } = req.query;

        // Validate the startDate
        if (!startDate || !isValid(parseISO(startDate))) {
            return res.status(400).json({ error: 'Invalid startDate' });
        }

        const parsedDate = parseISO(startDate);

        // Define the start and end of the day explicitly
        const startOfDay = setMilliseconds(setSeconds(setMinutes(setHours(parsedDate, 0), 0), 0), 0); // 00:00:00.000
        const endOfDay = setMilliseconds(setSeconds(setMinutes(setHours(parsedDate, 23), 59), 59), 999); // 23:59:59.999

        // Query users created within the day range and group by hour
        const usersByHour = await User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfDay,
                        $lte: endOfDay
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" },
                        hour: { $hour: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1
                }
            }
        ]);

        // Generate an array with all hours from 00:00 to 23:00
        const hoursInRange = eachHourOfInterval({
            start: startOfDay,
            end: endOfDay
        });

        // Format and pad the result
        const formattedResult = hoursInRange.map((hour) => {
            const formattedHour = `${hour.getFullYear()}-${String(hour.getMonth() + 1).padStart(2, '0')}-${String(hour.getDate()).padStart(2, '0')} ${String(hour.getHours()).padStart(2, '0')}:00`;

            // Find the matching hour in the database result
            const userForHour = usersByHour.find(item =>
                item._id.year === hour.getFullYear() &&
                item._id.month === hour.getMonth() + 1 &&
                item._id.day === hour.getDate() &&
                item._id.hour === hour.getHours()
            );

            // Return either the actual count or 0 if there was no user created in this hour
            return {
                hour: formattedHour,
                count: userForHour ? userForHour.count : 0
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching users by hour' });
    }
});

router.get('/users-by-all', async (req, res) => {
    try {
        // Get the earliest and latest user creation dates
        const firstUser = await User.findOne().sort({ createdAt: 1 });
        const lastUser = await User.findOne().sort({ createdAt: -1 });

        if (!firstUser || !lastUser) {
            return res.json([]); // No users in the database
        }

        // Define the date range
        const startDate = new Date(firstUser.createdAt);
        const endDate = new Date(lastUser.createdAt);

        // Query to get all users created within the range, grouped by day
        const usersByAll = await User.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Generate an array with all days in the date range
        const daysInRange = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        // Format and pad the result
        const formattedResult = daysInRange.map((day) => {
            const formattedDate = formatISO(day, { representation: 'date' });

            // Find the matching day in the database result
            const userForDay = usersByAll.find(item =>
                item._id.year === day.getFullYear() &&
                item._id.month === day.getMonth() + 1 &&
                item._id.day === day.getDate()
            );

            // Return either the actual count or 0 if there was no user created on this day
            return {
                date: formattedDate,
                count: userForDay ? userForDay.count : 0
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching all-time users' });
    }
});

router.post('/qr', async (req, res) => {
    try {
        const { name, repeat } = req.body;
        const qr = await QR.findOne({ name: name });
        if(!qr){
            let newQR;
            if(repeat){
                newQR = new QR({ name, scans: 1, repeated: 1 });
            } else {
                newQR = new QR({ name, scans: 1, repeated: 0 });
            }
            await newQR.save();
            console.log('QR scan registered');
            return { success: true, message: 'QR scan registered' };
        } else {
            qr.scans++;
            if(repeat){
                qr.repeated++;
            }
            await qr.save();
            console.log('QR scan registered');
            return { success: true, message: 'QR scan registered' };
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success :false, error: 'An error occurred while generating the QR code' });
    }
});


module.exports = router;

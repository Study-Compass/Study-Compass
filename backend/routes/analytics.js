const express = require('express');
const router = express.Router();
const { isValid, formatISO, parseISO, setHours, startOfWeek, endOfWeek, setMinutes, setSeconds, setMilliseconds, eachHourOfInterval, eachDayOfInterval } = require('date-fns');
const Visit = require('../schemas/visit');  // Assuming Visit is a Mongoose model for storing visits

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

module.exports = router;

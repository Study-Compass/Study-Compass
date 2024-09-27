const express = require('express');
const router = express.Router();
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
        const visitsByDay = await Visit.aggregate([
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

        // Format the response for easier readability
        const formattedResult = visitsByDay.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            count: item.count
        }));

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching visits by day' });
    }
});

router.get('/visits-by-hour', async (req, res) => {
    try {
        const visitsByHour = await Visit.aggregate([
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

        const formattedResult = visitsByHour.map(item => ({
            hour: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')} ${String(item._id.hour).padStart(2, '0')}:00`,
            count: item.count
        }));

        res.json(formattedResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while fetching visits by hour' });
    }
});


module.exports = router;

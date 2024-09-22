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

module.exports = router;

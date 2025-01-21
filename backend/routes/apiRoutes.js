// apiRoutes.js
const express = require('express');
const router = express.Router();
const Api = require('../models/api.js');
const User = require('../models/user.js'); 
const limiter = require('../middleware/rateLimit.js'); // Rate limiting middleware
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware.js'); // API key validation
const validateInput = require('../middleware/validate.js'); // Input validation middleware
const crypto = require('crypto'); // For generating API keys

// Generate a new API key
router.post('/generate', validateInput, async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const apiKey = crypto.randomBytes(32).toString('hex');
        const newApi = new Api({
            authorization_key: crypto.randomBytes(16).toString('hex'),
            api_key: apiKey,
            owner: userId
        });

        await newApi.save();

        res.status(201).json({ message: 'API key generated successfully.', apiKey: newApi });
    } catch (error) {
        console.error('Error generating API key:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Validate API key middleware
router.use('/protected', apiKeyMiddleware);

// Get API key details
router.get('/details', apiKeyMiddleware, async (req, res) => {
    const { authorization_key, api_key } = req.headers;

    try {
        const apiEntry = await Api.findOne({ authorization_key, api_key });
        if (!apiEntry) {
            return res.status(404).json({ error: 'API key not found.' });
        }

        res.status(200).json(apiEntry);
    } catch (error) {
        console.error('Error retrieving API key details:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Delete an API key
router.delete('/delete', apiKeyMiddleware, async (req, res) => {
    const { authorization_key, api_key } = req.headers;

    try {
        const deletedApi = await Api.findOneAndDelete({ authorization_key, api_key });
        if (!deletedApi) {
            return res.status(404).json({ error: 'API key not found.' });
        }

        res.status(200).json({ message: 'API key deleted successfully.' });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Apply rate limiter
router.use(limiter);

module.exports = router;


//DEBUG and Check if works 
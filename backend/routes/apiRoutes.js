const express = require('express');
const router = express.Router();
const Api = require('../models/api.js');
const User = require('../models/user.js');
const limiter = require('../middleware/rateLimit.js'); // Rate limiting middleware
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware.js'); // API key validation
const validateInput = require('../middleware/validate.js'); // Input validation middleware
const crypto = require('crypto'); // For generating API keys
const mongoose = require('mongoose');

// Generate a new API key   validateInput,
router.post('/create_api', validateInput, async (req, res) => {
    // DEBUG: Check if `req.user` exists and contains `userId`
    if (!req.user || !req.user.userId) {
        console.error('User ID is missing in the request.');
        return res.status(400).json({ error: 'User ID is required to generate an API key.' });
    }

    const userId = req.user.userId;

    try {
        // DEBUG: Verify if the user exists in the database
        const user = await User.findById(userId);
        if (!user) {
            console.error(`User with ID ${userId} not found.`);
            return res.status(404).json({ error: 'User not found.' });
        }

        // Generate API key and authorization key
        const apiKey = crypto.randomBytes(32).toString('hex');
        const authorizationKey = crypto.randomBytes(16).toString('hex');

        // Create and save the new API key entry
        const newApi = new Api({
            authorization_key: authorizationKey,
            api_key: apiKey,
            owner: userId
        });

        await newApi.save();

        console.log('POST: /generate_api successful. API key generated:', newApi);
        res.status(201).json({ message: 'API key generated successfully.', apiKey: newApi });
    } catch (error) {
        console.error('POST: /generate_api failed. Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
/*
// Validate API key middleware
router.use('/protected', apiKeyMiddleware);

// Get API key details
router.get('/details', apiKeyMiddleware, async (req, res) => {
    const { authorization_key, api_key } = req.headers;

    try {
        const apiEntry = await Api.findOne({ authorization_key, api_key });
        if (!apiEntry) {
            console.error('API key not found:', { authorization_key, api_key });
            return res.status(404).json({ error: 'API key not found.' });
        }

        console.log('GET: /details successful. API key details:', apiEntry);
        res.status(200).json(apiEntry);
    } catch (error) {
        console.error('GET: /details failed. Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Delete an API key
router.delete('/delete', apiKeyMiddleware, async (req, res) => {
    const { authorization_key, api_key } = req.headers;

    try {
        const deletedApi = await Api.findOneAndDelete({ authorization_key, api_key });
        if (!deletedApi) {
            console.error('API key not found for deletion:', { authorization_key, api_key });
            return res.status(404).json({ error: 'API key not found.' });
        }

        console.log('DELETE: /delete successful. Deleted API key:', deletedApi);
        res.status(200).json({ message: 'API key deleted successfully.' });
    } catch (error) {
        console.error('DELETE: /delete failed. Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Apply rate limiter
router.use(limiter);
*/


module.exports = router;

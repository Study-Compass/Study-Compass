const express = require('express');
const router = express.Router();
const Api = require('../schemas/api.js');
const User = require('../schemas/user.js');
const limiter = require('../middlewares/rateLimit.js'); // Rate limiting middleware
const {apiKeyMiddleware} = require('../middlewares/apiKeyMiddleware.js'); // API key validation
const {validateInput} = require('../middlewares/validate.js'); // Input validation middleware
const crypto = require('crypto'); // For generating API keys
const mongoose = require('mongoose');
const {verifyToken}= require('../middlewares/verifyToken');


//Need to make the Api Usable and give access
//CURRENT ERRRORS
/**
 * validate Input needs to be called like a middle ware {   } go back through validate and change sutff up 
 * need my rate limited
 * api Key Middle ware needs to be added  with protected routes
 */

// Generate a new API key 
router.post('/create_api', verifyToken, async (req, res) => { // Validate input needs to go in here  
    try {
       const userId = req.user.userId;  

       const user = await User.findById(userId);

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

        console.log('POST: /create_api successful. API key generated:', newApi);
        res.status(201).json({ message: 'API key generated successfully.', apiKey: newApi });
    } catch (error) {
        console.error('POST: /create_api failed. Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Validate API key middleware
router.use('/protected', apiKeyMiddleware);

// Get API key details

//Get details LOOK at MIDDLEWARE Debugging guide
router.get('/protected/details', apiKeyMiddleware, async (req, res) => {
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


/*
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

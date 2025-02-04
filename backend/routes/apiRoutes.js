const express = require('express');
const router = express.Router();
const Api = require('../schemas/api.js');
const User = require('../schemas/user.js');
const limiter = require('../middlewares/rateLimit.js'); // Rate limiting middleware
const {apiKeyMiddleware} = require('../middlewares/apiKeyMiddleware.js'); // API key validation
const crypto = require('crypto'); // For generating API keys
const mongoose = require('mongoose');
const {verifyToken}= require('../middlewares/verifyToken');


// Generate a new API key 
router.post('/create_api', verifyToken, limiter, async (req, res) => {  // Limit to how many keys can be created by 
    try {
       const userId = req.user.userId;
       const user = await User.findById(userId);

        // Generate API key and authorization key
        const apiKey = crypto.randomBytes(32).toString('hex');
        const authorizationKey = crypto.randomBytes(16).toString('hex');// Replace with userID

        // Create and save the new API key entry
        const newApi = new Api({
            authorization_key: authorizationKey,
            api_key: apiKey,
            owner: userId,
        });

        await newApi.save();

        console.log('POST: /create_api successful. API key generated:', newApi);
        res.status(201).json({success: true, message: 'API key generated successfully.', apiKey: newApi });
    } catch (error) {
        console.error('POST: /create_api failed. Error:', error);
        res.status(500).json({ sucess: false, message: 'Unable to generate api' }); 
    }
});

//WORKING RIGHT HERE
// Validate API key middleware- Make sure API exists, safe and clean,
//Should check and make sure middleware is present and linked to the account is what apiKeyMiddleware does
router.use('/protected', apiKeyMiddleware); // Make sure is nor redudndant

router.get('/protected/details', apiKeyMiddleware, limiter, async (req, res) => {
    //Should allow access to any route,(will this be specified?)
    const { authorization_key, api_key } = req.body;  // ALL I need is thhe api_key  userId
    try {
        const apiEntry = await Api.findOneAndUpdate({ authorization_key, api_key }, { $inc: { usageCount: 1 } }, { new: true });

        if (!apiEntry) {
            console.log('API key not found', error);
            return res.status(404).json({ error: 'API key not found.' });
        }
        console.log('GET: /details successful. API key details:', apiEntry);
        res.status(200).json(apiEntry);
    } catch (error) {


        console.log('GET: /details failed. Error', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


/*
// Delete an API key, userId could also be assumed// addeded
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

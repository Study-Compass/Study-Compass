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
router.post('/create_api', verifyToken, async (req, res) => { 
    try {
       const userId = req.user.userId;

        // Generate API key and verify user does not have any pre-existing one
        const existingApi = await Api.findOne({ owner: userId });
        if (existingApi) {
            console.log ('POST: /create_api failed. User already has an API key')
            return res.status(400).json({ success: false, message: 'User already has an API key.' });
        }
        const apiKey = crypto.randomBytes(32).toString('hex');

        // Create and save the new API key entry
        const newApi = new Api({
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

//router.use('/protected', apiKeyMiddleware); // ANY LINE THAT CONTAINS THE /protected will apply apiKeyMiddleware too

//Simplistic then detailed dont stress about key things
//If we want to grant access to a route, we want to grant access using the apiKeyMiddleware
//apiKeyMiddleware will guarantee and verify the existence of the key and then continue to grab items

router.get('/details', verifyToken, apiKeyMiddleware, async (req, res) => { //name to be changed
    //Should allow access to any route,(will this be specified?)
    try {
        const apiEntry = req.apiKeyData;

        if (!apiEntry) {
            console.log('API key not found', error);
            return res.status(404).json({ error: 'API key not found.' });
        }

        console.log('GET: /details successful. API key details:', apiEntry);
        res.status(200).json(apiEntry);
    } catch (error) {


        console.log('GET: /details failed. Error', error);
        res.status(500).json({ success: false, message: 'Unable to retrieve details.' });
    }
});

// Delete an API key, Verify user is the owner
router.delete('/delete-api', verifyToken, apiKeyMiddleware, async (req, res) => {
    const userId = req.user.userId;
    try {
        const deletedApi = await Api.findOneAndDelete({ owner: userId }); 
        
        if (!deletedApi) {
            console.error('API key not found for deletion');
            return res.status(404).json({ error: 'API key not found.' });
        }

        console.log('DELETE: /delete successful. Deleted API key:', deletedApi);
        res.status(200).json({ message: 'API key deleted successfully.' });
    } catch (error) {
        console.error('DELETE: /delete failed. Error:', error);
        res.status(500).json({success:false, message : 'Error deleting API.' });
    }
});



module.exports = router;

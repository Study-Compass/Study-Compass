const express = require('express');
const router = express.Router();
const { limiter, strictLimiter, burstLimiter, defaultLimiter } = require('../middlewares/rateLimit.js'); // Rate limiting middleware
const {apiKeyMiddleware} = require('../middlewares/apiKeyMiddleware.js'); // API key validation
const apiCors = require('../middlewares/apiCors.js'); // API-specific CORS middleware
const crypto = require('crypto'); // For generating API keys
const mongoose = require('mongoose');
const {verifyToken}= require('../middlewares/verifyToken');
const getModels = require('../services/getModelService.js');
require('dotenv').config();

// Apply CORS to all API routes
router.use(apiCors);

// Generate a new API key 
router.post('/create_api', verifyToken, async (req, res) => { 
    try {
        const { Api } = getModels(req, 'Api'); 
        //Add a set authorization here, just a tag to connect to api key front end will handle assigning
        //Authorized or Unauthorized try both 

       const userId = req.user.userId;
       const user_status = req.headers["Authorization"];// see if this works

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
            Authorization: "Unauthorized", // see if this works
            description: req.body.description || 'API key created via dashboard',
            scopes: req.body.scopes || ['read'],
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
            allowedIPs: req.body.allowedIPs || []
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

//Api key adds other servers to use our routes,  functionallity isnt to have to make a verify token
//Instead of checking user we should be checking the api key, trust any request with a valid api key, take out verifyToken, 


//Verify the api key, have a special header for api keys, when header is present should check validity of the api key, then pass them through rate limiters
//this is the only one that takes outside servers that not our front, prolly only given to none verify token routes, change user validity to api valdity

//associating a header : with an api key



/*
Tasks to do: 
find a way to test the request coming from a different server (new api with a new routing system
): create a new repositiory, a light weight server to use fetch or axios to call routes from a different server  (dont know the logistics) 
Set up one route/action 

calling a different api to another server 


- change validity from user, to strictly api key validation- make sure exists and cant be looped around
- rate limiting authority verification | associate the api in the create function with a tag based on their user id, would need to be assigned that tag from front end, but have it in schema 
//so thunder clients say "Authorization:" unauthorized_org , "apikey"
-api caller program

3/11/25
Changed interface and teach new syntax
Every route where i call a database route
small change or medium change
*/



router.get('/details', burstLimiter(), apiKeyMiddleware, async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    try {
        const apiKeyData = req.apiKeyData; 
        if (!apiKeyData) {
            return res.status(404).json({ error: 'API key not found' });
        }

        console.log('GET: /details successful. API key details:', apiKeyData);
        return res.status(200).json(apiKeyData);
    } catch (error) {
        console.error('GET: /details failed. Error:', error);  
        return next(error); 
    }
});

// Delete an API key, Verify user is the owner
router.delete('/delete-api', verifyToken, apiKeyMiddleware, async (req, res) => {
    const userId = req.user.userId;
    try {
        const { Api } = getModels(req, 'Api');
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

//temporary logic just to test connection
function checkApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.EDUREKA_API) {
      return next();
    } else {
      return res.status(403).json({ error: 'Forbidden: Invalid API key' });
    }
}

// Use different rate limiters for different endpoints
router.get('/events', defaultLimiter(), apiKeyMiddleware, async (req, res) => {
    
    try {
        const { Event } = getModels(req, 'Event');
        const events = await Event.find({});

        console.log('GET: /api/events successful. Events:', events);
        res.status(200).json(events);
    } catch (error) {
        console.error('GET: /api/events failed. Error:', error);
        res.status(500).json({ error: 'Unable to retrieve events' });
    }
});

//simple post request, returns what it gets
router.post('/test', burstLimiter(), apiKeyMiddleware, async (req, res) => {
    console.log('POST: /api/test successful. Request body:', req.body);
    res.status(200).json(req.body);
});

router.post('/sensitive', strictLimiter(), checkApiKey, async (req, res) => {
    try {
        // Process sensitive data
        console.log('POST: /api/sensitive successful. Processing sensitive data');
        res.status(200).json({ 
            success: true, 
            message: 'Sensitive operation completed successfully',
            data: req.body 
        });
    } catch (error) {
        console.error('POST: /api/sensitive failed. Error:', error);
        res.status(500).json({ error: 'Unable to process sensitive operation' });
    }
});

router.post('/rotate-api-key', verifyToken, apiKeyMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { Api } = getModels(req, 'Api');
        
        //find existing API key
        const existingApi = await Api.findOne({ owner: userId });
        if (!existingApi) {
            return res.status(404).json({ error: 'API key not found.' });
        }
        
        //generate new API key
        const newApiKey = crypto.randomBytes(32).toString('hex');
        
        //update the API key while preserving other properties
        existingApi.api_key = newApiKey;
        existingApi.usageCount = 0; //reset usage count
        existingApi.dailyUsageCount = 0; //reset daily usage count
        existingApi.lastUsageReset = new Date(); //reset last usage reset time
        
        await existingApi.save();
        
        console.log('POST: /rotate-api-key successful. API key rotated');
        res.status(200).json({ 
            success: true, 
            message: 'API key rotated successfully',
            apiKey: existingApi 
        });
    } catch (error) {
        console.error('POST: /rotate-api-key failed. Error:', error);
        res.status(500).json({ success: false, message: 'Error rotating API key' });
    }
});

//public API endpoint that doesn't require authentication
//testing purposes
// router.get('/public', defaultLimiter(), (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: 'Public API endpoint accessed successfully',
//         timestamp: new Date().toISOString()
//     });
// });

//route to reset rate limits for testing purposes, only available in development mode
router.post('/reset-rate-limit', async (req, res) => {
    //only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ 
            success: false, 
            message: 'Rate limit reset is only available in development mode' 
        });
    }
    
    try {
        const { Api } = getModels(req, 'Api');
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(400).json({ 
                success: false, 
                message: 'API key is required' 
            });
        }
        
        const apiKeyData = await Api.findOne({ api_key: apiKey });
        if (!apiKeyData) {
            return res.status(404).json({ 
                success: false, 
                message: 'API key not found' 
            });
        }
        
        apiKeyData.usageCount = 0;
        apiKeyData.dailyUsageCount = 0;
        apiKeyData.lastUsageReset = new Date();
        
        await apiKeyData.save();
        
        console.log('POST: /reset-rate-limit successful. Reset rate limit for API key:', apiKey);
        res.status(200).json({ 
            success: true, 
            message: 'Rate limit reset successfully',
            apiKey: apiKeyData
        });
    } catch (error) {
        console.error('POST: /reset-rate-limit failed. Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resetting rate limit' 
        });
    }
});

module.exports = router;

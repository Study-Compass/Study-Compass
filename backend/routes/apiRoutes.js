const express = require('express');
const router = express.Router();
const limiter = require('../middlewares/rateLimit.js'); // Rate limiting middleware
const {apiKeyMiddleware} = require('../middlewares/apiKeyMiddleware.js'); // API key validation
const crypto = require('crypto'); // For generating API keys
const mongoose = require('mongoose');
const {verifyToken}= require('../middlewares/verifyToken');
const getModels = require('../services/getModelService.js');
require('dotenv').config();

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
            Authorization: user_status // see if this works
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
change user id to strictly api idea
find a way to test the request coming from a different server (new api with a new routing system
): create a new repositiory, a light weight server to use fetch or axios to call routes from a different server  (dont know the logistics) 
Set up one route/action 

calling a different api to another server 

have the new header that signifys an api request,  if the api request to see if valid, if so let them through the next process
maybe add more validity
Unauthorized organization vs authorized prompt for rate (header in the schema), hard code how much rate each gets

Look through middleware debugger for anything 

- change validity from user, to strictly api key validation- make sure exists and cant be looped around
- rate limiting authority verification | associate the api in the create function with a tag based on their user id, would need to be assigned that tag from front end, but have it in schema 
//so thunder clients say "Authorization:" unauthorized_org , "apikey"
-api caller program




3/11/25
Changed interface and teach new syntax
Every route where i call a database route
small change or medium change
*/



router.get('/details', apiKeyMiddleware, async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    try {
        const apiKeyData = req.apiKeyData; // Assuming you set this in apiKeyMiddleware
        if (!apiKeyData) {
            return res.status(404).json({ error: 'API key not found' });
        }

        console.log('GET: /details successful. API key details:', apiKeyData);
        return res.status(200).json(apiKeyData);
    } catch (error) {
        console.error('GET: /details failed. Error:', error);  // Correctly reference 'error'
        return next(error);  // Pass the error to the next middleware or global error handler
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

router.get('/api/events', limiter(100), checkApiKey, async (req, res) => {
    
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


module.exports = router;

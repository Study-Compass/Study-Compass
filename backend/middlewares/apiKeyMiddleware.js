const API = require('../schemas/api.js');
const limiter = require('../middlewares/rateLimit.js'); 
const getModels = require('../services/getModelService.js');
//For routes http://localhost:5000/api/get-org-by-name/{club name} using the api key example route
// Middleware for validating API keys to make sure it exist, also validate that authorization is accepted

const apiKeyMiddleware = async (req, res, next) => {
    
    //User attached Api Key
    const { Api } = getModels(req, 'Api')
    const apiKey = req.headers['x-api-key']; // Verify apiId CHANGED see if it works  HAVE TO CHANGE
    try {
        //Verifies the Existence
        const apiKeyData = await Api.findOne({apiKey}); //Check if works
        

        console.log(apiKeyData);
        if (!apiKeyData) {
            console.log("API key does not exist for user");
            return res.status(401).json({ error: 'API key does not exist for user' });
        }

        //Add a status for rate limit here, better status more usages
        const clearance = apiKeyData.Authorization || "default"; // NEED TO ATTACH A TAG WITH KEY, test both cases, front end will handle who gets the tag
        let maxRequests;

        //Basic Framework if we want to change the different types
        switch (clearance){
            case "Unauthorized":
                maxRequests = 100;
                console.log(apiKeyData, "Unauthorized User Key: Limited ", maxRequests, " requests.\nCurrent Usage: ", apiKeyData.usageCount);
                break;
            case "Authorized":
                maxRequests = 500;
                console.log(apiKeyData, "Authorized User Key: Limited ", maxRequests, " requests.\nCurrent Usage: ", apiKeyData.usageCount);
                break;

            default: //Default with no tag is still unauthorized, see if this work
                maxRequests = 100;
                console.log(apiKeyData, "Unauthorized User Key: Limited ", maxRequests, " requests.\nCurrent Usage: ", apiKeyData.usageCount);
                break;
            }
        

        // Apply the rate limiter
        const apiKeyRateLimiter = limiter(maxRequests);
        apiKeyRateLimiter(req, res, async (error) => {
            if (error) return; 

            // Increment API key usage count
            apiKeyData.usageCount = (apiKeyData.usageCount || 0) + 1;
            await apiKeyData.save();
            console.log(`API Key Used. New usage count: ${apiKeyData.usageCount}`);

            // Store the API key data in the request object
            req.apiKeyData = apiKeyData;
            next();
        });

    } catch (error) {
        console.log('Error verifying API key:', error);
        return res.status(500).json({ error: 'Could not verify API key' });
    }
};


module.exports = { apiKeyMiddleware };

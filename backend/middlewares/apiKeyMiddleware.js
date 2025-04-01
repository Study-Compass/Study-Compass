const API = require('../schemas/api.js');
const limiter = require('../middlewares/rateLimit.js'); 
const getModels = require('../services/getModelService.js');

// Middleware for validating API keys and enforcing rate limits
const apiKeyMiddleware = async (req, res, next) => {
    const { Api } = getModels(req, 'Api');
    const apiKey = req.headers['x-api-key']; 
    
    try {
        console.log("Received API Key");
        const apiKeyData = await Api.findOne({ api_key: apiKey }); 
        
        if (!apiKeyData) {
            console.log("API key does not exist for user");
            return res.status(401).json({ error: 'API key does not exist for user' });
        }

        // Determine clearance level and rate limits
        const clearance = apiKeyData.Authorization || "default"; 
        let maxRequests;

        switch (clearance) {
            case "Unauthorized":
                maxRequests = 100;
                break;
            case "Authorized":
                maxRequests = 500;
                break;
            default:
                maxRequests = 100; 
                break;
        }

        console.log(`Clearance: ${clearance} | Max Requests: ${maxRequests} | Current Usage: ${apiKeyData.usageCount}`);

        // BLOCK EXCESSIVE REQUESTS BEFORE PROCESSING
        if (apiKeyData.usageCount >= maxRequests) {
            console.log(`Exceded limit (${apiKeyData.usageCount}/${maxRequests}). Blocking request.`);
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        }

        // Increment usage count and save
        apiKeyData.usageCount = (apiKeyData.usageCount || 0) + 1;
        await apiKeyData.save();

        console.log(`API Key Used. New usage count: ${apiKeyData.usageCount}`);

        // Attach API key data to the request object for use in later routes
        req.apiKeyData = apiKeyData;

        // Apply Rate Limiter Middleware
        const apiKeyRateLimiter = limiter(maxRequests);
        apiKeyRateLimiter(req, res, (error) => {
            if (error) {
                return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
            }
            next();
        });

    } catch (error) {
        console.error('Error verifying API key:', error);
        return res.status(500).json({ error: 'Could not verify API key' });
    }
};

module.exports = { apiKeyMiddleware };

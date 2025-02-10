const API = require('../schemas/api.js');
const apiKeyRateLimiter = require('../middlewares/rateLimit.js'); 
//For routes http://localhost:5000/api/get-org-by-name/{club name} using the api key example route
// Middleware for validating API keys to make sure it exist, also validate that authorization is accepted

const apiKeyMiddleware = async (req, res, next) => {
    
    const userId = req.user.userId;
    try {
        
        const apiKeyData = await API.findOne({ owner: userId });
        console.log(apiKeyData);
        if (!apiKeyData) {
            console.log("API key does not exist for user");
            return res.status(401).json({ error: 'API key does not exist for user' });
        }

        // Apply the rate limiter
        apiKeyRateLimiter(req, res, async (error) => {
            // Stop execution if rate limit is exceeded
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
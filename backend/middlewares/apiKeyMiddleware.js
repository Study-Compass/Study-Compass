//Stores API handling of where can be accessed 
//Will need to store the apiKey in this function to then check in any route for this key and if route exist then user can access
const API = require('../schemas/api.js');

//For routes http://localhost:5000/api/get-org-by-name/{club name} using the api key example route

// Middleware for validating API keys to make sure it exist, also validate that authorization is accepted
const apiKeyMiddleware = async (req, res, next) => {
    //const { owner, api_key } = req.body;
    const userId = req.user.userId

    //With these changes i made you shouldnt need owner box or api key it should just find the owner based on verify token, make sure i dont need this

    //if (!owner || !api_key) { 
    //   return res.status(401).json({ error: 'Missing API key.' });
    //}

    try {
        const apiKeyData = await Api.findOne({ owner: userId });
        if (!apiKeyData) {
            console.log("API key does not exist for user");
            return res.status(401).json({ error: 'API key does not exist for user' });
        }

        // Increment the usage count
        apiKeyData.usageCount = (apiKeyData.usageCount || 0) + 1;
        await apiKeyData.save();
        console.log(`API Key Used. New usage count: ${apiKeyData.usageCount}`);

        req.apiKeyData = apiKeyData // Saves the apiKey into the middleware, to be used across platforms
        next();

    } catch (error) {
        console.log('Error verifying API key:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};


module.exports = { apiKeyMiddleware };
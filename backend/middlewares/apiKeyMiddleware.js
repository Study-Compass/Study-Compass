//Stores API handling of where can be accessed 
//KEY NOTES THAT IM RETURNING TO
//apiKeyMiddleWare -> apiRoutes 
const API = require('../schemas/api.js');
const validate = require('./validate.js');
const monitoring = require('./monitoring.js');
const rateLimit = require('./rateLimit.js');

// Middleware for validating API keys
const apiKeyMiddleware = async (req, res, next) => {
    console.log("THIS SHIT HIT")
    const { authorization_key, api_key } = req.headers;

    if (!authorization_key || !api_key) {
        return res.status(401).json({ error: 'Missing authorization or API key.' });
    }

    try {
        const apiEntry = await API.findOne({ authorization_key, api_key });
        if (!apiEntry) {
            return res.status(401).json({ error: 'Invalid authorization or API key.' });
        }
        next();

    } catch (error) {
        console.log('Error verifying API key:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};


module.exports = { apiKeyMiddleware };
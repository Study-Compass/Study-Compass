//Stores API handling of where can be accessed 
const API = require('../schemas/api.js');
const monitoring = require('./monitoring.js');

// Middleware for validating API keys to make sure it exist, also validate that authorization is accepted
const apiKeyMiddleware = async (req, res, next) => {
    const { authorization_key, api_key } = req.body;

    if (!authorization_key || !api_key) {
       return res.status(401).json({ error: 'Missing authorization or API key.' });
    }

    try {
        const apiEntry = await API.findOne({ authorization_key, api_key });
        if (!apiEntry) {
            console.log("Cant verify authorization or API");
            return res.status(401).json({ error: 'Invalid authorization or API key.' });
        }
        next();

    } catch (error) {
        console.log('Error verifying API key:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};


module.exports = { apiKeyMiddleware };
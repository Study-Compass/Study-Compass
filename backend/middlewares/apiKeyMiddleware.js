const mongoose = require('mongoose');
const getModels = require('../services/getModelService.js');

const apiKeyMiddleware = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key is required' });
        }

        const { Api } = getModels(req, 'Api');
        const apiKeyData = await Api.findOne({ api_key: apiKey });

        if (!apiKeyData) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        //check if API key is expired
        if (apiKeyData.expiresAt && new Date() > apiKeyData.expiresAt) {
            return res.status(401).json({ error: 'API key has expired' });
        }

        //check IP whitelist if configured
        if (apiKeyData.allowedIPs && apiKeyData.allowedIPs.length > 0) {
            const clientIP = req.ip;
            if (!apiKeyData.allowedIPs.includes(clientIP)) {
                return res.status(403).json({ error: 'IP not whitelisted' });
            }
        }

        //attach API key data to request for use in other middleware
        req.apiKeyData = apiKeyData;
        next();
    } catch (error) {
        console.error('API Key Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { apiKeyMiddleware };


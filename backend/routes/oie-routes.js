const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const OIEConfig = require('../schemas/OIEConfig');
const OIEStatus = require('../schemas/OIE');

router.get('/config', verifyToken, async (req, res) => {
    try {
        const config = await OIEConfig.findOne({});
        if (!config) {
            return res.status(404).json({ message: 'Config not found' });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/config', verifyToken, async (req, res) => {
    try {
        const config = await OIEConfig.findOne({});
        if (config) {
            // Update existing config
            config.config = req.body.config;
            await config.save();
            return res.json(config);
        }
        const newConfig = new OIEConfig(req.body);
        await newConfig.save();
        res.json(newConfig);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
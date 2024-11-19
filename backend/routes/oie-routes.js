const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');
const OIEConfig = require('../schemas/OIEConfig');
const OIEStatus = require('../schemas/OIE');
const Event = require('../schemas/event');

router.get('/config', verifyToken, async (req, res) => {
    try {
        const config = await OIEConfig.findOne({});
        if (!config) {
            return res.status(404).json({ message: 'Config not found' });
        }
        console.log('GET: /config successful');
        res.json(config);
    } catch (error) {
        console.log('GET: /config failed', error);
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
        console.log('POST: /config successful');
        res.json(newConfig);
    } catch (error) {
        console.log("POST: /config failed", error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/oie-status', verifyToken, async (req, res) => {
    try {
        const { eventRef, status, checkListItems } = req.body;
        const oieStatus = await OIEStatus.findOne({ eventRef });
        if (oieStatus) {
            oieStatus.status = status;
            oieStatus.checkListItems = checkListItems;
            await oieStatus.save();
            const event = await Event.findById(eventRef);
            event.OIEStatus = status;
            await event.save();
            console.log('POST: /oie-status successful');
            return res.json(oieStatus);
        }
        const newOIEStatus = new OIEStatus(req.body);
        await newOIEStatus.save();
        const event = await Event.findById(eventRef);
        event.OIEStatus = status;
        await event.save();
        console.log(event);
        console.log('POST: /oie-status successful');
        res.json(newOIEStatus);
    } catch (error) {
        console.log('POST: /oie-status failed', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
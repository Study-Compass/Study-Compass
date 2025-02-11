const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/verifyToken');
const oieConfigSchema = require('../schemas/OIEConfig');
const oieStatusSchema = require('../schemas/OIE');
const eventSchema = require('../schemas/event');
const getModels = require('../services/getModelService');

router.get('/config', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { OIEConfig } = getModels(req, 'OIEConfig');
    try {
        const config = await OIEConfig.findOne({});
        if (!config) return res.status(404).json({ message: 'Config not found' });
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/config', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { OIEConfig } = getModels(req, 'OIEConfig');
    try {
        let config = await OIEConfig.findOne({});
        if (config) {
            config.config = req.body.config;
            await config.save();
        } else {
            config = new OIEConfig(req.body);
            await config.save();
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/oie-status', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { OIEStatus, Event } = getModels(req, 'OIEStatus', 'Event');
    try {
        const { eventRef, status, checkListItems } = req.body;
        let oieStatus = await OIEStatus.findOne({ eventRef });
        if (oieStatus) {
            oieStatus.status = status;
            oieStatus.checkListItems = checkListItems;
            await oieStatus.save();
        } else {
            oieStatus = new OIEStatus(req.body);
            await oieStatus.save();
        }
        const event = await Event.findById(eventRef);
        if (event) {
            event.OIEStatus = status;
            await event.save();
        }
        res.json(oieStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

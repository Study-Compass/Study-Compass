const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/verifyToken');
const getModels = require('../services/getModelService');

// Get system configuration
router.get('/event-system-config', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        let config = await EventSystemConfig.findOne();
        
        if (!config) {
            // Create default configuration
            config = new EventSystemConfig({
                systemSettings: {
                    defaultEventSettings: {
                        rsvpEnabled: false,
                        rsvpRequired: false,
                        maxAttendees: null,
                        approvalRequired: true,
                        visibility: 'campus'
                    },
                    notificationSettings: {
                        defaultChannels: ['email', 'in_app'],
                        reminderIntervals: [24, 2], // 24 hours and 2 hours before
                        escalationTimeouts: 72,
                        batchNotificationLimit: 100
                    },
                    systemRestrictions: {
                        maxEventsPerUser: 10,
                        maxEventsPerOrg: 50,
                        advanceBookingLimit: 365,
                        minBookingAdvance: 1,
                        blackoutDates: [],
                        restrictedEventTypes: []
                    }
                },
                domains: [],
                eventTemplates: [],
                integrations: {
                    calendar: {
                        google: { enabled: false, credentials: '' },
                        outlook: { enabled: false, credentials: '' },
                        apple: { enabled: false, credentials: '' }
                    },
                    external: {
                        eventbrite: { enabled: false, apiKey: '' },
                        facebook: { enabled: false, accessToken: '' },
                        meetup: { enabled: false, apiKey: '' }
                    },
                    campus: {
                        studentInformation: { enabled: false, endpoint: '' },
                        facilities: { enabled: false, endpoint: '' },
                        security: { enabled: false, endpoint: '' }
                    }
                },
                analytics: {
                    enabled: true,
                    retentionPeriod: 365,
                    reportSchedules: []
                }
            });
            await config.save();
        }
        console.log('GET: /event-system-config', config);
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error fetching event system config:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update system configuration
router.put('/event-system-config', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const updates = req.body;
        
        const config = await EventSystemConfig.findOneAndUpdate(
            {},
            updates,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error updating event system config:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get domain-specific configuration
router.get('/domain-config/:domainId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const { domainId } = req.params;
        
        const config = await EventSystemConfig.findOne();
        const domain = config?.domains.find(d => d.domainId.toString() === domainId);
        
        if (!domain) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: domain
        });
    } catch (error) {
        console.error('Error fetching domain config:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add new domain
router.post('/domain', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const newDomain = req.body;
        
        const config = await EventSystemConfig.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'System configuration not found'
            });
        }
        
        // Check if domain already exists
        const existingDomain = config.domains.find(d => d.domainId.toString() === newDomain.domainId);
        if (existingDomain) {
            return res.status(400).json({
                success: false,
                message: 'Domain already exists'
            });
        }
        
        config.domains.push(newDomain);
        await config.save();
        
        res.status(201).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error adding domain:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update domain
router.put('/domain/:domainId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const { domainId } = req.params;
        const updates = req.body;
        
        const config = await EventSystemConfig.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'System configuration not found'
            });
        }
        
        const domainIndex = config.domains.findIndex(d => d.domainId.toString() === domainId);
        if (domainIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }
        
        config.domains[domainIndex] = { ...config.domains[domainIndex], ...updates };
        await config.save();
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error updating domain:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete domain
router.delete('/domain/:domainId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const { domainId } = req.params;
        
        const config = await EventSystemConfig.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'System configuration not found'
            });
        }
        
        const domainIndex = config.domains.findIndex(d => d.domainId.toString() === domainId);
        if (domainIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }
        
        config.domains.splice(domainIndex, 1);
        await config.save();
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error deleting domain:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add event template
router.post('/template', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const newTemplate = req.body;
        
        const config = await EventSystemConfig.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'System configuration not found'
            });
        }
        
        config.eventTemplates.push(newTemplate);
        await config.save();
        
        res.status(201).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error adding template:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update event template
router.put('/template/:templateId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const { templateId } = req.params;
        const updates = req.body;
        
        const config = await EventSystemConfig.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'System configuration not found'
            });
        }
        
        const templateIndex = config.eventTemplates.findIndex(t => t.templateId.toString() === templateId);
        if (templateIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }
        
        config.eventTemplates[templateIndex] = { ...config.eventTemplates[templateIndex], ...updates };
        await config.save();
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete event template
router.delete('/template/:templateId', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const { EventSystemConfig } = getModels(req, 'EventSystemConfig');
        const { templateId } = req.params;
        
        const config = await EventSystemConfig.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'System configuration not found'
            });
        }
        
        const templateIndex = config.eventTemplates.findIndex(t => t.templateId.toString() === templateId);
        if (templateIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }
        
        config.eventTemplates.splice(templateIndex, 1);
        await config.save();
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

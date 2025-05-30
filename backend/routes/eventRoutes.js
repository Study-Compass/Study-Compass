const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional, authorizeRoles } = require('../middlewares/verifyToken');
const getModels = require('../services/getModelService');
const { createApprovalInstance, getEventsWithAuthorization } = require('../utilities/workflowUtilities');
const multer = require('multer');
const path = require('path');
const { uploadImageToS3, upload } = require('../services/imageUploadService');
const IntegrationsService = require('./integrations/integrationsService');

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 5MB limit.'
            });
        }
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

router.post('/create-event', verifyToken, upload.single('image'), handleMulterError, async (req, res) => {
    const { Event, OIEStatus, User } = getModels(req, 'Event', 'OIEStatus', 'User');
    const user_id = req.user.userId;
    const orgId = req.body.orgId;
    const file = req.file;
    
    try {
        let eventData = { ...req.body };
        
        // Remove image field from eventData if it exists
        delete eventData.image;
        
        let event;

        if(orgId){
            console.log(orgId);
            const user = await User.findById(user_id);
            if(!user.clubAssociations.includes(orgId)){
                return res.status(403).json({
                    "message": 'you are not authorized to create an event as this organization'
                })
            }
            event = new Event({
                ...eventData,
                hostingId : orgId,
                hostingType : 'Org',
            });
        } else {
            event = new Event({
                ...eventData,
                hostingId : user_id,
                hostingType : 'User',
            });
        }

        // Handle image upload if file is present
        if (file) {
            console.log('Uploading image');
            const fileExtension = path.extname(file.originalname);
            const fileName = `${event._id}${fileExtension}`;
            const imageUrl = await uploadImageToS3(file, 'events', fileName);
            event.image = imageUrl;
            //console.log('Image uploaded successfully:', imageUrl);
        }
    
        const approvalInstance = await createApprovalInstance(req, event._id, event);
        if (approvalInstance) {
            event.approvalReference = approvalInstance._id;
            console.log('Approval instance created');
            console.log(event.approvalInstance);
            event.status = 'pending';
        } else{
            event.status = 'not-applicable';
        }

        await event.save();

        //run school-specific integrations if they exist
        eventData = await IntegrationsService.runIntegration(
            req.school,  
            'create-event',
            event,
            req.db 
        );
        
        console.log('POST: /create-event successful');
        res.status(201).json({
            success: true,
            message: 'Event created successfully.',
            eventId: event._id
        });
    } catch (error) {
        console.log('POST: /create-event failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events created by the user
router.get('/get-events', verifyToken, async (req, res) => {
    const { Event, User } = getModels(req, 'Event', 'User');
    const user_id = req.user.userId;

    try {
        const events = await Event.find({ user_id }).populate('classroom_id');
        console.log('GET: /get-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events
router.get('/get-all-events', verifyTokenOptional, async (req, res) => {
    const { Event, User } = getModels(req, 'Event', 'User');
    try {
        const events = await Event.find({ 
            OIEStatus: { $nin: ['Rejected', 'Pending'] },
            isDeleted: false 
        })
            .populate('classroom_id')
            .populate('hostingId');
        console.log('GET: /get-all-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-all-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events in a classroom
router.get('/get-classroom-events/:classroom_id', verifyTokenOptional, async (req, res) => {
    const { Event } = getModels(req, 'Event');
    const { classroom_id } = req.params;

    try {
        const events = await Event.find({ classroom_id }).populate('classroom_id');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all events user is going to
router.get('/get-going-events', verifyToken, async (req, res) => {
    const { Event, User } = getModels(req, 'Event', 'User');
    const user_id = req.user.userId;

    try {
        const user = await User.findById(user_id);
        const events = await Event.find({ _id: { $in: user.going } }).populate('classroom_id');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// delete event
router.delete('/delete-event/:event_id', verifyToken, async (req, res) => {
    const { Event } = getModels(req, 'Event');
    const { event_id } = req.params;
    const user_id = req.user.userId;

    try {
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        if (event.hostingId.toString() !== user_id.toString() && !user.approvalRoles.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this event.'
            });
        }

        // Soft delete by setting isDeleted flag
        event.isDeleted = true;
        await event.save();

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get all oie-unapproved events
router.get('/oie/get-pending-events', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { Event, OIEStatus } = getModels(req, 'Event', 'OIEStatus');
    // const { start, end, filter, roles } = req.query;

    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 99);
    const filter = { status: 'pending'};
    const roles = ['Heffner Alumni House'];

    try {
        const events = await getEventsWithAuthorization(req, filter, ['Heffner Alumni House'], start, end, ['classroom_id', 'hostingId']);
        console.log(events);

        console.log('GET: /get-events-by-pending successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-events-by-week failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }

});

//get all oie-unapproved events
router.get('/oie/get-approved-events', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { Event, User } = getModels(req, 'Event', 'User');
    try {
        const user = await User.findById(req.user.userId);
        if (!user ) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this page.'
            });
        }
        const events = await Event.find({ OIEStatus: 'Approved' }).populate('classroom_id').populate('hostingId');
        console.log('GET: /oie/get-approved-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /oie/get-approved-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

//get all oie-unapproved events
router.get('/oie/get-rejected-events', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { Event, User } = getModels(req, 'Event', 'User');
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this page.'
            });
        }
        const events = await Event.find({ OIEStatus: 'Rejected' }).populate('classroom_id').populate('hostingId');
        console.log('GET: /oie/get-rejected-events successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /oie/get-rejected-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/get-event/:event_id', verifyTokenOptional, async (req, res) => {
    const { Event, User, OIEStatus, ApprovalInstance } = getModels(req, 'Event', 'User', 'OIEStatus', 'ApprovalInstance');
    const { event_id } = req.params;
    const { type } = req.query;
    const user_id = req.user ? req.user.userId : null;

    try {
        const user = user_id ? await User.findById(user_id) : null;
        let eventQuery = Event.findOne({ _id: event_id });

        // Populate approvalReference conditionally based on approvalInstance
        const approvalInstance = await ApprovalInstance.findOne({ eventId: event_id });

        if (approvalInstance && user) {
            // Check if user has approval roles if approvalInstance exists
            if (user.approvalRoles.length > 0) {
                if(type === 'approval'){
                    eventQuery = eventQuery
                        .populate('classroom_id')
                        .populate('hostingId')
                        .populate({
                            path: 'approvalReference',
                            populate: {
                            path: 'comments.userId', // populate userId inside comments
                            model: 'User'
                            }
                        });

                } else {
                    eventQuery = eventQuery.populate('classroom_id').populate('hostingId');
                }
            } else {
                // If no approval roles, return an unauthorized response
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to view this page.'
                });
            }
        } else {
            // If no approvalInstance exists, just return the event without additional population
            eventQuery = eventQuery.populate('classroom_id').populate('hostingId');
        }

        const event = await eventQuery;

        if (!event) {
        return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        return res.status(200).json({
            success: true,
            event
        });
    } catch (error) {
        console.log('GET: /get-event failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
router.post('/approve-event', verifyToken, async (req, res) => {
    const { Event, User, ApprovalInstance } = getModels(req, 'Event', 'User', 'ApprovalInstance');
    const user_id = req.user.userId;
    const { event_id } = req.body;

    try {
        const user = await User.findById(user_id);
        if(!user) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve events.'
            });
        }
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }
        // if (event.OIEStatus !== 'Pending') {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Event is not pending approval.'
        //     });
        // }
        // event.OIEStatus = 'Approved';
        const approvalInstance = await ApprovalInstance.findOne({ eventId: event_id });
        if (!approvalInstance) {
            return res.status(404).json({
                success: false,
                message: 'Approval instance not found.'
            });
        }
        const roleNeeded = approvalInstance.approvals[approvalInstance.currentStepIndex].role;
        if (!user.approvalRoles.includes(roleNeeded)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to approve this event.'
            });
        }
        approvalInstance.approvals[approvalInstance.currentStepIndex].status = 'approved';
        approvalInstance.approvals[approvalInstance.currentStepIndex].approvedByUserId = user_id;
        approvalInstance.approvals[approvalInstance.currentStepIndex].approvedAt = new Date();
        approvalInstance.currentStepIndex++;
            
        await event.save();
        console.log('POST: /approve-event successful');
        res.status(200).json({
            success: true,
            message: 'Event approved successfully.'
        });
    } catch (error) {
        console.log('POST: /approve-event failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/get-events-by-month', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { Event, OIEStatus } = getModels(req, 'Event', 'OIEStatus');
    const { month, year, filter, roles } = req.query;

    if (!month || !year) {
        return res.status(400).json({
            success: false,
            message: 'Month and year are required parameters.',
        });
    }

    try {
        console.log(filter);
        // Parse month and year into integers
        const parsedMonth = parseInt(month, 10) - 1; // JavaScript months are 0-indexed
        const parsedYear = parseInt(year, 10);

        // Construct the start and end of the month
        const startOfMonth = new Date(parsedYear, parsedMonth, 1); // First day of the month
        const endOfMonth = new Date(parsedYear, parsedMonth + 1, 0, 23, 59, 59, 999); // Last day of the month

        let filterObj;
        const safeOperators = ['$gte', '$lte', '$eq', '$ne', '$in']; // Allow only these
        if (filter) {
            try {
                const decodedFilter = JSON.parse(decodeURIComponent(filter));
                Object.keys(decodedFilter).forEach(key => {
                    if (typeof decodedFilter[key] === 'object') {
                        Object.keys(decodedFilter[key]).forEach(op => {
                            if (!safeOperators.includes(op)) {
                                throw new Error('Invalid query operator');
                            }
                        });
                    }
                });
                filterObj = decodedFilter;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid filter format.',
                });
            }
        }

        const events = await getEventsWithAuthorization(req, filterObj, roles, startOfMonth, endOfMonth, ['classroom_id', 'hostingId']);

        console.log('GET: /get-events-by-month successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-events-by-month failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/get-events-by-range', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { Event, OIEStatus } = getModels(req, 'Event', 'OIEStatus');
    const { start, end, filter, roles } = req.query;

    if (!start || !end) {
        return res.status(400).json({
            success: false,
            message: 'Start and end dates are required parameters.',
        });
    }

    try {
        const startOfRange = new Date(start);
        const endOfRange = new Date(end);
        //log dates
        //make into eastern time
        //print formatted time
        let filterObj;

        const safeOperators = ['$gte', '$lte', '$eq', '$ne', '$in']; // Allow only these
        if (filter) {
            try {
                const decodedFilter = JSON.parse(decodeURIComponent(filter));
                Object.keys(decodedFilter).forEach(key => {
                    if (typeof decodedFilter[key] === 'object') {
                        Object.keys(decodedFilter[key]).forEach(op => {
                            if (!safeOperators.includes(op)) {
                                throw new Error('Invalid query operator');
                            }
                        });
                    }
                });
                filterObj = decodedFilter;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid filter format.',
                });
            }
        }

        let query = filterObj && filterObj.type !== "all" ?{
            start_time: { $gte: startOfRange, $lte: endOfRange },
            ...filterObj
        } :
        {
            start_time: { $gte: startOfRange, $lte: endOfRange },
        };


        const events = await getEventsWithAuthorization(req, filterObj, roles, startOfRange, endOfRange, ['classroom_id', 'hostingId']);
        console.log(events);
        // const events = await Event.find(query)
        //     .populate('classroom_id')
        //     .populate('hostingId')
        //     // .populate('OIEReference');

        console.log('GET: /get-events-by-week successful');
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.log('GET: /get-events-by-week failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Upload event image
router.post('/upload-event-image', verifyToken, upload.single('image'), async (req, res) => {
    const { Event } = getModels(req, 'Event');
    const file = req.file;
    const { eventId } = req.body;

    if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Create filename using event ID and original extension
        const fileExtension = path.extname(file.originalname);
        const fileName = `${eventId}${fileExtension}`;

        // Upload image to S3
        const imageUrl = await uploadImageToS3(file, 'events', fileName);
        
        // Update event with new image URL
        event.image = imageUrl;
        await event.save();

        return res.status(200).json({ 
            success: true, 
            message: 'Event image uploaded successfully',
            imageUrl 
        });
    } catch (error) {
        console.error('Error uploading event image:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to upload event image',
            error: error.message 
        });
    }
});

router.get('/get-future-events', verifyToken, authorizeRoles('oie'), async (req, res) => {
    const { Event } = getModels(req, 'Event');
    const { page = 1, limit = 10, filter, roles } = req.query;
    
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    try {
        let filterObj;
        const safeOperators = ['$gte', '$lte', '$eq', '$ne', '$in']; // Allow only these
        if (filter) {
            try {
                const decodedFilter = JSON.parse(decodeURIComponent(filter));
                Object.keys(decodedFilter).forEach(key => {
                    if (typeof decodedFilter[key] === 'object') {
                        Object.keys(decodedFilter[key]).forEach(op => {
                            if (!safeOperators.includes(op)) {
                                throw new Error('Invalid query operator');
                            }
                        });
                    }
                });
                filterObj = decodedFilter;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid filter format.',
                });
            }
        }

        // Base query for events from the start of today
        let query = {
            end_time: { $gte: currentDate }
        };

        // Add additional filters if they exist
        if (filterObj && filterObj.type !== "all") {
            query = { ...query, ...filterObj };
        }

        // Get total count for pagination
        const totalEvents = await Event.countDocuments(query);

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalPages = Math.ceil(totalEvents / parseInt(limit));

        // Get paginated events with authorization, sorting by start_time
        const events = await getEventsWithAuthorization(
            req,
            filterObj,
            roles,
            currentDate,
            new Date('9999-12-31'), // Far future date to get all future events
            ['classroom_id', 'hostingId'],
            skip,
            parseInt(limit),
            { start_time: 1 } // Sort by start_time in ascending order
        );

        console.log('GET: /get-future-events successful');
        res.status(200).json({
            success: true,
            events,
            pagination: {
                total: totalEvents,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.log('GET: /get-future-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/get-my-events', verifyToken, async (req, res) => {
    const {User, Event} = getModels(req, 'User', 'Event');
    const userId = req.user.userId;
    const { type = 'future', sort = 'asc' } = req.query;
    const currentDate = new Date();

    try {
        let query = {
            hostingId: userId,
            isDeleted: false
        };

        // Apply filter based on the type parameter
        switch(type) {
            case 'future':
                query.start_time = { $gte: currentDate };
                break;
            case 'past':
                query.end_time = { $lt: currentDate };
                break;
            case 'archived':
                query.isDeleted = true;
                break;
            case 'ongoing':
                query.start_time = { $lte: currentDate };
                query.end_time = { $gte: currentDate };
                break;
            default:
                // Default to future events
                // query.start_time = { $gte: currentDate };
        }

        // Determine sort order
        const sortOrder = sort === 'desc' ? -1 : 1;

        let userEvents = await Event.find(query)
            .populate('hostingId')
            .sort({ start_time: sortOrder });

        if(userEvents) {
            console.log(`GET: /get-my-events successful ${type}`);
            return res.status(200).json({
                success: true,
                message: "events found",
                events: userEvents
            });
        } else {
            console.log(`GET: /get-my-events empty ${type}`);
            return res.status(200).json({
                success: true,
                message: "no events found",
                events: []
            });
        }
    } catch(error) {
        console.log('GET: /get-my-events failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// flush out this route,
router.post('/create-event-from-template', verifyToken, async (req, res) => {
    const {Event, User} = getModels(req, 'Event', 'User');
    const userId = req.user.userId;
    const {templateId} = req.body;
    
    try{
        const template = await Event.findById(templateId);
        if(!template){
            return res.status(404).json({success: false, message: 'Template not found'});
        }
    } catch(error){
        console.log('POST: /create-event-from-template failed', error);
    }
});

//development route to shift events forward a week
router.post('/shift-events-forward', verifyToken, authorizeRoles('admin'), async (req, res) => {
    const {Event} = getModels(req, 'Event');
    const {days} = req.body;

    // ENABLE UPON RELEASE
    // if(process.env.NODE_ENV !== 'development'){
    //     return res.status(403).json({
    //         success: false,
    //         message: 'This route is only available in development mode'
    //     });
    // }

    
    try{
        const events = await Event.find({});
        for(const event of events){
            event.start_time = new Date(event.start_time.getTime() + days * 24 * 60 * 60 * 1000);
            event.end_time = new Date(event.end_time.getTime() + days * 24 * 60 * 60 * 1000);
            await event.save();
        }
        console.log('POST: /shift-events-forward successful');
        res.status(200).json({
            success: true,
            message: 'Events shifted forward successfully'
        });
    } catch(error){
        console.log('POST: /shift-events-forward failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/add-approval-comment', verifyToken, async (req, res) => {
    const { Event, User, ApprovalInstance } = getModels(req, 'Event', 'User', 'ApprovalInstance');
    const user_id = req.user.userId;
    const { event_id, comment, parentCommentId } = req.body;

    try {
        const user = await User.findById(user_id);
        if(!user) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to add comments.'
            });
        }

        const event = await Event.findById(event_id);
        if (!event) {
        return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const approvalInstance = await ApprovalInstance.findOne({ eventId: event_id });
        if (!approvalInstance) {
            return res.status(404).json({
                success: false,
                message: 'Approval instance not found.'
            });
        }

        // If parentCommentId is provided, verify it exists
        if (parentCommentId) {
            const parentComment = approvalInstance.comments.id(parentCommentId);
            if (!parentComment) {
                //check if parent comment is a reply
                return res.status(404).json({
                    success: false,
                    message: 'Parent comment not found.'
                });
            }
        }

        // Add comment to the current approval step
        //push to the front of the array
        approvalInstance.comments.unshift({
            userId: user_id,
            text: comment,
            createdAt: new Date(),
            parentCommentId: parentCommentId || null
        });

        await approvalInstance.save();

        
        console.log('POST: /add-approval-comment successful');
        res.status(200).json({
            success: true,
            message: 'Comment added successfully.',
            comment: approvalInstance.comments[0]
        });
    } catch (error) {
        console.log('POST: /add-approval-comment failed', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/delete-approval-comment', verifyToken, async (req, res) => {
    const { Event, User, ApprovalInstance } = getModels(req, 'Event', 'User', 'ApprovalInstance');
    const user_id = req.user.userId;
    const { event_id, comment_id } = req.body;

    try {
        const event = await Event.findById(event_id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found.'
            });
        }

        const approvalInstance = await ApprovalInstance.findOne({ eventId: event_id });
        if (!approvalInstance) {
            return res.status(404).json({
                success: false,
                message: 'Approval instance not found.' 
            });
        }

        //find comment in approval instance
        const comment = approvalInstance.comments.id(comment_id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found.'
            });
        }

        //delete comment
        approvalInstance.comments.pull(comment_id); 

        await approvalInstance.save();

        console.log('POST: /delete-approval-comment successful');
        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully.'
        });
    } catch (error) {
        console.log('POST: /delete-approval-comment failed', error);
        res.status(500).json({
            success: false, 
            message: error.message
        });
    }
});

module.exports = router;

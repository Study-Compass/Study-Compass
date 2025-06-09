const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenOptional, authorizeRoles } = require('../../middlewares/verifyToken');
const getModels = require('../../services/getModelService');
const rssTransformService = require('../../services/rss/rssTransformService');
const transformers = require('../../services/rss/transformers');
const axios = require('axios');
const fs = require('fs');

router.post('/sync-rss', async (req, res) => {
    const { Event, RssFeed } = getModels(req, 'Event', 'RssFeed');
    const { rssId } = req.body;

    //get all rss feeds
    try{
        const rssFeed = await RssFeed.findById(rssId);
        if(!rssFeed){
            return res.status(404).json({
                success: false,
                message: 'Rss feed not found'
            });
        }
        let transformer = transformers[rssFeed.name] ? rssTransformService.createCustomTransformer(transformers[rssFeed.name]) : rssTransformService;
        //get rss content
        const rssContent = await axios.get(rssFeed.url);
        const events = await transformer(rssContent.data);
        let createdEvents = 0;
        let updatedEvents = 0;
        //create events
        for(let event of events){
            //check if event already exists
            const existingEvent = await Event.findOne({ rssId: event.rssId });
            if(existingEvent){
                //update event
                await Event.findByIdAndUpdate(existingEvent._id, event);
                updatedEvents++;
            }else{
                await Event.create(event);
                createdEvents++;
            }
        }
        //write xml to file
        return res.status(200).json({
            success: true,
            message: 'Events created successfully',
            eventsCreated: createdEvents,
            eventsUpdated: updatedEvents,
            events: events
        });
    } catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

});
/* 


https://events.rpi.edu/feeder/main/eventsFeed.do?f=y&sort=dtstart.utc:asc&fexpr=(categories.href!=%22/public/.bedework/categories/Ongoing%22)%20and%20(entity_type=%22event%22%20or%20entity_type=%22todo%22)&skinName=list-rss&count=100*/

module.exports = router;
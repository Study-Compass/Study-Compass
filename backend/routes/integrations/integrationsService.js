const axios = require('axios');
const integrations = {
    'rpi': {
        // RPI-specific integrations
        'create-event': async (eventData, db) => {
            try {
                //edureka integration
                const newEvent = edurekaEventTransform(eventData);
                const createdEvent = await edurekaEventCreate(newEvent);
                return createdEvent;
            } catch (error) {
                console.error('RPI event integration failed:', error);
                return eventData; // Return original data if integration fails
            }
        },
        'delete-event': async (eventId, db) => {
            // Example: Notify RPI's system about event deletion
            try {
                await notifyEdurekaEventDeletion(eventId);
                return true;
            } catch (error) {
                console.error('RPI event deletion integration failed:', error);
                return false;
            }
        }
    },
    'ucb': {
        // UCB-specific integrations

        // example integration below
        // 'create-event': async (eventData, db) => {
        //     try {
        //         eventData.ucbCalendarId = await syncWithUcbCalendar(eventData);
        //         return eventData;
        //     } catch (error) {
        //         console.error('UCB event integration failed:', error);
        //         return eventData;
        //     }
        // }
    }
};

class IntegrationsService {
    static async runIntegration(school, action, data, db) {
        //check if school has integrations
        if (!integrations[school]) {
            return data; //return original data if no integrations exist
        }

        //check if specific action has integration
        if (!integrations[school][action]) {
            return data; //return original data if no integration for this action
        }

        try {
            if(process.env.NODE_ENV === 'production'){
                return await integrations[school][action](data, db);
            } else {
                return data;
            }
        } catch (error) {
            console.error(`Integration failed for ${school} - ${action}:`, error);
            return data; //return original data if integration fails
        }
    }
}

function edurekaEventTransform(eventData) {
    //omit status and isDeleted fields
    const { status, isDeleted, approvalReference, ...rest } = eventData;

    //create new event object
    const newEvent = {
        ...rest,
    }
    return newEvent;
}

async function edurekaEventCreate(eventData) {
    //implementation for creating an event in edureka
    try{
        //try pinging
        const pingResponse = await axios.get('https://edureka-607e7cfece20.herokuapp.com/api_studycompass/');
        if(pingResponse.status !== 200){
            console.log('Edureka is not responding');
            return eventData;
        }
        console.log('Edureka is responding');
        const response = await axios.post('https://edureka-607e7cfece20.herokuapp.com/api_studycompass/create', eventData, {
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': process.env.EDUREKA_API_KEY
            }
        });
        //console log status
        if(response.status === 200){
            console.log('Event created in edureka');
            return response.data;
        } else {
            console.log('Event creation failed in edureka');
            return eventData;
        }
    } catch(error){
        //log error code
        console.log('Error code:', error.response.status);
        return eventData;
    }
}   

async function notifyEdurekaEventDeletion(eventId) {
    // Implementation for notifying edureka about event deletion
    console.log(`Notifying Edureka about event deletion: ${eventId}`);
}

async function syncWithUcbCalendar(eventData) {
    // Implementation for syncing with UCB calendar
    return 'UCB-' + Date.now();
}

module.exports = IntegrationsService; 
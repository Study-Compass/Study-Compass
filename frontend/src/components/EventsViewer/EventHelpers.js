import axios from 'axios';

const getUser = async (userId) => {
    try{
        const response = await axios.get('/get-user', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            params: { userId }  // Pass the userId as query parameter
        });
        return response.data.user;
    } catch(error){
        throw error;
    }
}

const getAllEvents = async () => {
    try{
        const response = await axios.get('/get-all-events', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        return response.data.events;
    } catch(error){
        throw error;
    }
}

const getOIEEvents = async () => {
    try{
        const response = await axios.get('/oie/get-pending-events', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        return response.data.events;
    } catch(error){
        throw error;
    }
}

const createEvent = async (name, type, hosting, location, date, description, image, classroom_id) => {
    try{
        const response = await axios.post('/create-event', {
            name, type, hosting, location, date, description, image, classroom_id
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            }
        });
        return response.data;
    }
    catch(error){
        throw error;
    }
}


export { getAllEvents, createEvent, getOIEEvents };
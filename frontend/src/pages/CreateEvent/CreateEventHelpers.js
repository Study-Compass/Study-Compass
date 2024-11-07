import axios from 'axios';

const createEvent = async (body) => {
    try{
        const response = await axios.post('/create-event', body , {
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

export { createEvent };
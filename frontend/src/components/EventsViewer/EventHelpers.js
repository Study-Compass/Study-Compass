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

export { getAllEvents };
import postRequest from '../../utils/postRequest';

export const createEvent = async (eventData) => {
    try {
        const response = await postRequest('/create-event', eventData);
        if (response.success) {
            return response;
        }
        return null;
    } catch (error) {
        console.error('Error creating event:', error);
        return null;
    }
};
import axios from 'axios';

async function getVisitsByDay() {
    try {
        const response = await axios.get('/visits-by-day');
        return response.data;
    } catch (error) {
        console.error('Error fetching visits by day', error);
        return [];
    }
}

export { getVisitsByDay };
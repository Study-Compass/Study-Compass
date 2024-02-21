import axios from 'axios';


const getRooms = async () => {
    try {
        const response = await fetch(`/getrooms`);
        const responseBody = await response.text(); // First, always read the response as text

        if (!response.ok) {
            // Log the error if the response status is not OK
            console.error("Error fetching data:", responseBody);
            return;
        }

        let rooms;
        try {
            rooms = JSON.parse(responseBody); // Then, parse the text as JSON
        } catch (jsonError) {
            // Log the JSON parsing error along with the raw response
            console.error("JSON parsing error:", jsonError);
            console.log("Raw response:", responseBody);
            return;
        }

        console.log(rooms);
        return rooms;
    } catch (error) {
        console.error("Error:", error);

    }

};

const getRoom = async (id) => {
    try {
        const response = await fetch(`/getroom/${id}`);
        const data = await response.json();
        // console.log(data);
        return data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
};

const getFreeRooms = async (query) => {
    try {
        const response = await axios.post('/free', { query });
        const roomNames = response.data;
        // console.log(`names:${roomNames}`); // Process the response as needed
        // console.log(roomNames); // Process the response as needed
        return roomNames;
    } catch (error) {
        console.error('Error fetching free rooms:', error);
    }
};

function debounce(func, wait) { //move logic to other file
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


export { getRooms, getRoom, getFreeRooms, debounce };
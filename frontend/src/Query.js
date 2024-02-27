import axios from 'axios';


const getRooms = async () => {
    try {
        const response = await fetch(`/getrooms`);
        const responseBody = await response.json();

        if (!response.ok) {
            // Log the error if the response status is not OK
            console.error("Error fetching data:", responseBody.message);
            return;
        }

        if (!responseBody.success) {
            // Log the error if success is false
            console.error("Error fetching room names:", responseBody.message);
            return;
        }

        //console.log(responseBody.data);
        console.log(responseBody.data);
        return responseBody.data;
    } catch (error) {
        console.error("Error:", error);

    }

};

const getRoom = async (id) => {
    try {
        const response = await fetch(`/getroom/${id}`);
        const data = await response.json();
        //console.log(data.data);
        return data.data;
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
};

const getFreeRooms = async (query) => {
    try {
        const response = await axios.post('/free', { query });
        const responseBody = response.data;

        if (!responseBody.success) {
            // Log the error message if the operation was not successful
            console.error("Error fetching free rooms:", responseBody.message);
            return;
        }

        const roomNames = responseBody.data; // Extract the room names from the response data
        //console.log(roomNames); // Log the room names or process them as needed
        return roomNames;
    } catch (error) {
        console.error('Error fetching free rooms:', error);
        return []; // Return an empty array or handle the error as needed
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
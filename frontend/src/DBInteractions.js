import axios from "axios";

const changeClasroom = async (id, attributes, imageUrl) => {
    try {
        const response = await axios.post(`/changeclassroom/`, { id, attributes, imageUrl });
        const responseBody = response.data;
        if (!response.ok) {
            // Log the error if the response status is not OK
            console.error("Error changing room:", responseBody.message);
            return;
        }

        if (!responseBody.success) {
            // Log the error if success is false
            console.error("Error changing room:", responseBody.message);
            return;
        }
        return responseBody.data;
    } catch (error) {
        if (error.response) {
            // The server responded with a status code outside the 2xx range
            console.error("Error changing room: HTTP Status", error.response.status, error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error changing room: No response received", error.request);
        } else {
            // Something else caused the error, like a setup issue
            console.error("Error:", error.message);
        }
        throw error;
    }
};  

export { changeClasroom };
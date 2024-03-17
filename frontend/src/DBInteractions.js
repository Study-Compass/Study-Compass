import axios from "axios";

const changeClasroom = async (id, attributes) => {
    try {
        const response = await axios.post(`/changeclassroom/`, { id, attributes });
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
        console.error("Error:", error);
    }
};  

export { changeClasroom };
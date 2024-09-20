import axios from "axios";

//todo: make protected route
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




//expects roomid, userid, and operation, true for save, false for unsave
const save = async (roomId, userId, operation) => {
    try {
        const response = await axios.post(`/save/`, { roomId, userId, operation }, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
        const responseBody = response.data;
        if (!response.ok) {
            // Log the error if the response status is not OK
            console.error("Error saving room:", responseBody.message);
            return;
        }
        if (!responseBody.success) {
            // Log the error if success is false
            console.error("Error saving room:", responseBody.message);
            return;
        }
        return responseBody.data;
    } catch (error) {
        if (error.response) {
            // The server responded with a status code outside the 2xx range
            console.error("Error saving room: HTTP Status", error.response.status, error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error saving room: No response received", error.request);
        } else {
            // Something else caused the error, like a setup issue
            console.error("Error:", error.message);
        }
        throw error;
    }
};

const saveUser = async (name, username, email, password, recommendation, classroom) => {
    try{
        const response = await axios.post('/update-user', {name, email, username, classroom, recommendation, onboarded :null}, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
        const responseBody = response.body;
        console.log(response);
        if (response.data.success) {
            console.log("User saved successfully");
        } else {
            console.error("User save unsuccessful");
        }
    } catch(error){
        console.error("Error saving user");
        throw error;
    }

}

const checkUsername = async (username) => {
    try {
        const response = await axios.post("/check-username/", { username },{
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(response);
        const responseBody = response.data;
        if (!responseBody.success) {
            // Log the error if the response status is not OK
            console.error("Error checking username:", responseBody.message);
            return null;
        }
        if (!responseBody.success) {
            return false;
        }
        return true;
    } catch (error) {

        throw error;
    }
}



const sendError = async (description, roomid) => {
    try {
        const reportData = {
            report: {
                roomid: roomid,
                description: description
            },
            type: "incorrectData"
        };

            
        await axios.post('/send-report', reportData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        throw error;
    }
}

const checkIn = async (classroomId) => {
    try{
        const response = await axios.post('/check-in', {classroomId}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("successful");
        const responseBody = response.data;
        return response;
    } catch (error){
        throw error;
    }
}

const checkOut = async (classroomId) => {
    try{
        const response = await axios.post('/check-out', {classroomId}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("successful");
        return response;
    } catch(error){
        throw error;
    }
}

const getUser = async (userId) => {
    try{
        const response = await axios.get('/get-user', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            params: { userId }  // Pass the userId as query parameter
        });
        console.log("successful");
        return response.data.user;
    } catch(error){
        throw error;
    }
}

const getUsers = async (userIds) => {
    try{
        const response = await axios.get('/get-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            params: { userIds }  // Pass the userIds as query parameter
        });
        console.log("successful");
        return response.data.users;
    } catch(error){
        throw error;
    }
}

//all purpose rating route, can be used to create new ratings, update ratings (update downvote), and edit ratings
const updateRating = async (classroomId, userId, comment, score, upvotes, downvotes) => {
    try{
        const response = await axios.post('/update_rating', {classroomId, userId, comment, score, upvotes, downvotes}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("successful");
        return response;
    }
    catch(error){
        throw error;
    }
}

const userRated = async (classroomId, userId) => {
    try{
        const response = await axios.get('/user-rated', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            params: {classroomId, userId}
        });
        console.log("successful");
        return response;
    } catch(error){
        throw error;
    }
}

const mainSearchChange = async (classroomId) => {
    try{
        const response = await axios.post('/main-search-change', {classroomId}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("successful");
        return response;
    }
    catch(error){
        throw error;
    }
}

const getRecommendation = async () => {
    const token = localStorage.getItem('token');;
    try{
        const response = await axios.get('/get-recommendation', {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        console.log("successful");
        return response;
    } catch(error){
        throw error;
    }
}


export { changeClasroom, save, checkUsername, saveUser, sendError, checkIn, checkOut, getUser, getUsers, updateRating, userRated, mainSearchChange, getRecommendation };
import axios from 'axios';


const getFriends = async () => {
    const response = await axios.get('/friends', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const responseBody = response.data;

    if (!responseBody.success) {
        console.error('Error fetching friends:', responseBody.message);
        return [];
    } else {
        return responseBody.data;
    }
}

const sendFriendRequest = async (friendUsername) => {
    try{
        const response = await axios.post(`/friend-request/${friendUsername}`, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const responseBody = response.data;
        if(!responseBody.success){
            console.error('Error sending friend request:', responseBody.message);
            return responseBody.message;
        } else {
            return 'Friend request sent';
        }
    } catch (error){
        if(error.response.status === 404){
            return 'User not found';
        }
        // console.log(error);
        // if(error.response.message === 'Friend request already sent.'){
        //     return 'Friend request already sent';
        // }
        // if(error.response.message === 'Friend already exists.'){
        //     return 'Friend already exists';
        // }

        return error.response.data.message;
    }
}

const updateFriendRequest = async (friendshipId, status) => {
    if(status !== 'accepted' && status !== 'rejected'){
        console.error('Invalid status');
        return;
    }
    let response
    if(status === 'accept'){
        response = await axios.post(`/friend-request/accept/${friendshipId}`, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    } else {
        response = await axios.post(`/friend-request/reject/${friendshipId}`, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    }
    const responseBody = response.data;
    if(!responseBody.success){
        console.error('Error updating friend request:', responseBody.message);
        return 'Error updating friend request';
    } else {
        return 'Friend request updated';
    }
}

const getFriendRequests = async () => {
    const response = await axios.get('/friend-requests', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    const responseBody = response.data;
    if(!responseBody.success){
        console.error('Error fetching friend requests:', responseBody.message);
        return [];
    } else {
        return responseBody.data;
    }
}

export { getFriends, sendFriendRequest, updateFriendRequest, getFriendRequests };
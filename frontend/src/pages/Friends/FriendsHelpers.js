import axios from 'axios';

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

const userSearch = async (query, setResults) => {
    try{
        const response = await axios.get(`/user-search/${query}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const responseBody = response.data;
        if(!responseBody.success){
            console.error('Error fetching search data:', responseBody.message);
            return [];
        }
        console.log(responseBody.data);
        setResults(responseBody.data);
        return responseBody.data;
    } catch (error){
        console.error('Error fetching search data:', error);
        return [];
    }
}

const debounceUserSearch = debounce(userSearch, 500);

const getFriends = async () => {
    try{
        const response = await axios.get('/getFriends', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const responseBody = response.data;
        console.log(responseBody);
        if (!responseBody.success) {
            console.error('Error fetching friends:', responseBody.message);
            return [];
        } else {
            return responseBody.data;
        }
    } catch (error){
        throw error;
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
        return error.response.data.message;
    }
}

const updateFriendRequest = async (friendshipId, status) => {
    try{
        if(status !== 'accept' && status !== 'reject'){
            console.error('Invalid status');
            return;
        }
        let response;
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
    } catch (error){
        console.error('Error updating friend request:', error);
        return 'Error updating friend request';
    }
}

const getFriendRequests = async () => {
    try{
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
    } catch (error){
        throw error;
    }
}

const unFriend = async (friendId) => {
    try{
        const response = await axios.post(`/unfriend/${friendId}`, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const responseBody = response.data;
        if(!responseBody.success){
            console.error('Error unfriending:', responseBody.message);
            return responseBody.message;
        } else {
            return 'Unfriended';
        }
    } catch (error){
        console.error('Error unfriending:', error);
        return 'Error unfriending';
    }
}

export { getFriends, sendFriendRequest, updateFriendRequest, getFriendRequests, unFriend, debounceUserSearch };
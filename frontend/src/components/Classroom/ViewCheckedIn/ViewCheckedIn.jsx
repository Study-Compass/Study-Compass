import React, { useState, useEffect } from 'react';
import pfp from '../../../assets/defaultAvatar.svg';
import Badges from '../../Badges/Badges';
import Friend from '../../../pages/Friends/Friend/Friend.jsx';
import { getFriends, sendFriendRequest, updateFriendRequest, getFriendRequests, debounceUserSearch } from '../../../pages/Friends/FriendsHelpers.js';
import { useNotification } from '../../../NotificationContext.js';
import './ViewCheckedIn.scss';


function ViewCheckedIn({currentUser, users, room, checkIn, checkOut}){
    const [error, setError] = useState([]);
    const [reload, setReload] = useState(0);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const { addNotification } = useNotification();
    const handleFriendRequest = async (friendUsername) => {
        const result = await sendFriendRequest(friendUsername);
        setReload(reload + 1);
        if(result === 'Friend request sent'){
            addNotification({title: 'Friend request sent', message: 'Friend request sent successfully', type: 'success'});
            return;
        }
        if(result === 'User not found'){
            addNotification({title: 'User not found', message: 'We could not find a user with that username', type: 'error'});
        } else {
            addNotification({title: 'Error sending friend request', message: result, type: 'error'});
        }
    }

    useEffect(() => {
            const fetchFriends = async () => {
                try{
                    const result = await getFriends();
                    setFriends(result);
                } catch (error){
                    console.error('Error fetching friends:', error);
                }
            }
            const fetchFriendRequests = async () => { 
                try{
                    const result = await getFriendRequests();
                    console.log(result);
                    setFriendRequests(result);
                } catch (error){
                    console.error('Error fetching friend requests:', error);
                }
            }
            fetchFriends();
            fetchFriendRequests();
        }, [reload]);

    useEffect(() => {
        //populate error array with all false for every user
        setError(new Array(users.length).fill(false));
    }, [users]);

    const onError = (index) => {
        let newError = [...error];
        newError[index] = true;
        setError(newError);
    }
    console.log(currentUser);
    useEffect(() => {
        console.log(error);
    }, [error]);
    return (
        <div className="checked-in-users">
            {
                <h3>Currently checked in to {room.name}</h3>
            }
            <div className="list-users">
                {users.map((user, index) => {
                    return (
                        <div className="list-user-line">
                            <div className="list-user-top">
                                <img 
                                    src={error[index] === true ? pfp : user && user.picture ? user.picture : pfp} 
                                    alt={user ? user.name : ""} 
                                    key={user ? user._id : ""} 
                                    className={`user `}
                                    onError={()=> onError(index)}
                                />
                                <div className="list-user-right">
                                    <div className="top-line">
                                        <h2>{user.name}</h2>
                                        <div className="checked-in-hours">
                                            Checked in for x hours
                                        </div>
                                    </div>
                                    <h4>@{user.username}</h4>
                                    <Badges badges={user && user.tags} size="9px"/>
                                </div>
                                <div className="add-friend" onClick={ handleFriendRequest }>
                                    add
                                </div>
                                
                            </div>
                            
                            {users.length===1 ? <span></span> : <span className="multiple-user"></span>} 
                        </div>
                        
                    )
                })}
            </div>
            <div className="button-container">   
                {
                    currentUser && room.checked_in.includes(currentUser._id) ?
                    <button className="out check-in-button" onClick={checkOut}>check out</button>
                    :
                    <button className="check-in-button" onClick={checkIn}>check in</button>
                }
            </div>
        </div>
    )
}

export default ViewCheckedIn;
import React, { useState, useEffect } from 'react';
import './Friends.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Header from '../../components/Header/Header.jsx';
import pfp from '../../assets/defaultAvatar.svg'
import Friend from './Friend/Friend.jsx';
import AddFriend from '../../assets/Icons/Add-Friend.svg';
import { getFriends, sendFriendRequest, updateFriendRequest, getFriendRequests } from './FriendsHelpers.js';
import { useNotification } from '../../NotificationContext.js';
import FriendRequest from './FriendRequest/FriendRequest.jsx';

function Friends() {
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const navigate = useNavigate();
    const [addValue, setAddValue] = useState("");
    const [contentState, setContentState] = useState('friends');
    
    const { addNotification } = useNotification();

    const friend ={
        username: "james",
        picture: pfp
    }

    useEffect(() => {
        console.log(isAuthenticating);
        if(isAuthenticating){
            return;
        }
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticating, isAuthenticated, navigate]);

    useEffect(() => {
        const fetchFriends = async () => {
            const result = await getFriends();
            console.log(result);
        }
        if(isAuthenticated){
            fetchFriends();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if(addValue.length === 1 && addValue[0] !== '@'){
            setAddValue('@' + addValue);
        }
        if(addValue === '@'){
            setAddValue('');
        }
    },[addValue]);

    const handleAddChange = (e) => {
        setAddValue(e.target.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await sendFriendRequest(addValue.slice(1));
        console.log(result);
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

    const [viewport, setViewport] = useState("100vh");
    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
    },[]);

    const handlePending = () =>{
        console.log('pending');
        setContentState(contentState === 'pending' ? 'friends' : 'pending');
    };

    return (
        
        <div className="friends component" style={{height: viewport}}>
            <Header />
            { user && isAuthenticated &&
                <div className="friends-container">
                    <div className="friends-content">
                        <div className="user">
                            <div className="profile-picture">
                                <img src={pfp} alt="" />
                            </div>
                                <div className="user-content">
                                    <h1>{user.username}</h1>
                                    <p>@{user.username}</p>
                                </div>
                        </div>
                        <form className="add-friend" onSubmit={handleSubmit}>
                            <input type="text" placeholder="add a friend" value={addValue} onChange={handleAddChange}/>
                            <div className="add-friend-icon">
                                <img src={AddFriend} alt=""/>
                            </div>
                            <button type="submit">add</button>
                        </form>

                        <div className="friends-list">
                            <div className="friends-list-header">
                                <h2>friends</h2>
                                <p className={`no-select ${contentState === 'pending' ? "active" : ""}`} onClick={handlePending}>pending</p>
                            </div>
                            <div className={`content-container  ${contentState === 'pending' ? "left-staging" : ""}`}>

                                <div className={`content`} >
                                    <Friend friend={friend}/>
                                    <Friend friend={friend}/>
                                    <Friend friend={friend}/>
                                    <Friend friend={friend}/>
                                </div>
                                <div className={`content pending`} >
                                    <FriendRequest friendRequest={friend}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

export default Friends;
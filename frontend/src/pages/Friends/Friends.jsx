import React, { useState, useEffect } from 'react';
import './Friends.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Header from '../../components/Header/Header.jsx';
import pfp from '../../assets/defaultAvatar.svg'
import Friend from './Friend/Friend.jsx';
import AddFriend from '../../assets/Icons/Add-Friend.svg';

function Friends() {
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const navigate = useNavigate();
    const [addValue, setAddValue] = useState("");
    
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

    const [viewport, setViewport] = useState("100vh");
    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
    },[]);

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
                        <form className="add-friend">
                            <input type="text" placeholder="add a friend" value={addValue} onChange={handleAddChange}/>
                            <div className="add-friend-icon">
                                <img src={AddFriend} alt=""/>
                            </div>
                            <button type="submit">add</button>
                        </form>

                        <div className="friends-list">
                            <div className="friends-list-header">
                                <h2>friends</h2>
                            </div>
                            <Friend friend={friend}/>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

export default Friends;
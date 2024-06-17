import React, { useState, useEffect } from 'react';
import './Friends.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Header from '../../components/Header/Header.jsx';
import pfp from '../../assets/defaultAvatar.svg'

function Friends() {
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log(isAuthenticating);
        if(isAuthenticating){
            return;
        }
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticating, isAuthenticated, navigate]);

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
                        <div className="add-friend">
                            <input type="text" placeholder="add a friend" />
                            <button>add</button>
                        </div>

                        <div className="friends-list">
                            <div className="friends-list-header">
                                <h2>friends</h2>
                            </div>
                            <div className="no-friends">
                                <h2>you have no friends :((</h2>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

export default Friends;
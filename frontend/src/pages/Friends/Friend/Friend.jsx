import React, { useState, useEffect } from 'react';
import './Friend.css';

function Friend({ friend }) {
    return (
        <div className="friend">
            <div className="friend-content">
                <div className="profile-picture">
                    <img src={friend.picture} alt="" />
                </div>
                <div className="user-content">
                    <h1>{friend.username}</h1>
                    <p>@{friend.username}</p>
                </div>
            </div>
        </div>
    );
}

export default Friend;
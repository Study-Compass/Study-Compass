import React from 'react';
import './FriendRequest.css';
import Friend from '../Friend/Friend';
import { useNotification } from '../../../NotificationContext';

function FriendRequest({ friendRequest }) {
    const { addNotification } = useNotification();

    const handleAccept = async () => {
        console.log('accepting friend request');
        addNotification('Friend request accepted');
    }

    const handleDecline = async () => {
        console.log('declining friend request');
        addNotification('Friend request declined');
    }

    return (
        <div className="friend-request">
            <Friend friend={friendRequest} />
            <div className="friend-request-buttons">
                <button className='accept 'onClick={handleAccept}>accept</button>
                <button className='decline'  onClick={handleDecline}>decline</button>
            </div>
        </div>
    );
}

export default FriendRequest;
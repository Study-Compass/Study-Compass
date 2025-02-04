import React, { useState, useEffect } from 'react';
import './Friend.scss';
import pfp from '../../../assets/defaultAvatar.svg';
import { unFriend } from '../FriendsHelpers';
import { useNotification } from '../../../NotificationContext';
import Badges from '../../../components/Badges/Badges';

function Friend({ friend, isFriendRequest, reload, setReload }) {
    const [isHovering, setIsHovering] = useState(false);

    const { addNotification } = useNotification();

    const handleUnFriend = async () => {
        try{
            const response = await unFriend(friend._id);
            setReload(reload + 1);
            if(response === 'Unfriended'){
                console.log('Friend removed');
                addNotification({title: 'Friend removed', message: `You have removed ${friend.username} from your friends`, type: 'success'});
            } else {
                console.error('Error removing friend:', response);
                addNotification({title: 'Error removing friend', message: response, type: 'error'});
            }
        } catch (error){
            console.error('Error removing friend:', error);
            addNotification({title: 'Error removing friend', message: error.message, type: 'error'});
        }
    }

    return (
        <div className="friend" onMouseEnter={()=>{setIsHovering(true)}} onMouseLeave={()=>{setIsHovering(false)}}>
            <div className="friend-content">
                <div className="profile-picture">
                    <img src={friend.picture ? friend.picture : pfp} alt="" />
                </div>
                <div className="user-content">
                    <h1>{friend.name}</h1>
                    <p>@{friend.username}</p>
                    <Badges badges = {friend.tags ? friend.tags : []}/>
                </div>
            </div>
            {isFriendRequest && <div className='AddButton'>add</div>}
            {
                !isFriendRequest && isHovering &&
                <button className="action" onClick={handleUnFriend}>
                    remove
                </button>
            }
        </div>
    );
}

export default Friend;
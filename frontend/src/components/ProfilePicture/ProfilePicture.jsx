import React, { useState, useEffect }from 'react'
import './ProfilePicture.css'
import pfp from '../../assets/defaultAvatar.svg'
import useAuth from '../../hooks/useAuth';


function ProfilePicture(){
    const [showPopup, setShowPopup] = useState(false);
    const { logout, user } = useAuth();
    return(
        <div className="profile-picture">
            <div className={`popup ${showPopup ? "popup-active":""}`}>
                <div className="popup-content">
                    <p>{user ? user.username : "no user"}</p>
                    <img className="profile" src ={user.picture ? user.picture : pfp} onClick={()=>{setShowPopup(!showPopup)}}></img>
                </div>
                { showPopup ? <button onClick={logout}>logout</button>: "" }
            </div>
        </div>
    )
}

export default ProfilePicture;
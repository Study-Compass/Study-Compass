import React, { useState, useEffect }from 'react'
import './ProfilePicture.css'
import pfp from '../../assets/defaultAvatar.svg'
import useAuth from '../../hooks/useAuth';


function ProfilePicture(){
    const [showPopup, setShowPopup] = useState(false);
    const { logout, user } = useAuth();
    return(
        <div className="profile-picture">
            <img className="profile" src = {pfp} onClick={()=>{setShowPopup(!showPopup)}}></img>
            <div className={`popup ${showPopup ? "popup-active":""}`}>
                <button onClick={logout}>logout</button>

            </div>
        </div>
    )
}

export default ProfilePicture;
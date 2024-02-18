import React from 'react'
import './ProfilePicture.css'
import pfp from '../../assets/defaultAvatar.svg'


function ProfilePicture(){
    return(
        <div className="profile-picture">
            <img className="profile" src = {pfp}></img>
            <div className="popup"></div>
        </div>
    )
}

export default ProfilePicture;
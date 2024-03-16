import React, { useState, useEffect }from 'react'
import './ProfilePicture.css'
import pfp from '../../assets/defaultAvatar.svg'
import useAuth from '../../hooks/useAuth';
import '../../assets/fonts.css'

import ProfileIcon from '../../assets/Icons/Profile.svg'
import Settings from '../../assets/Icons/Settings.svg'
import Guide from '../../assets/Icons/Guide.svg'
import Logout from '../../assets/Icons/Logout.svg'

function ProfilePicture(){
    const [showPopup, setShowPopup] = useState(false);
    const { logout, user } = useAuth();
    return(
        <div className="profile-picture">
            <img className="profile" src ={user.picture ? user.picture : pfp} onClick={()=>{setShowPopup(!showPopup)}}></img>
            <div className={`popup ${showPopup ? "popup-active":""}`}>
                <div className="popup-content">
                    <img className="profile" src ={user.picture ? user.picture : pfp}></img>
                    <div className="profile-info">
                        <h3>James Liu</h3>
                        <div className="badges">
                            <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                                <p>beta</p>
                            </div>
                        </div>
                    </div>
                </div>
                <hr />
                <div className="menu-item">
                    <img className="icon" src={ProfileIcon} alt="profile" />
                    <p>Profile</p>
                </div>
                <div className="menu-item">
                    <img className="icon" src={Settings} alt="settings" />
                    <p>Settings</p>
                </div>
                <hr />
                <div className="menu-item">
                    <img className="icon" src={Guide} alt="guide" />
                    <p>Guide</p>
                </div>
                <hr />
                <div className="menu-item" onClick={logout}>
                    <img className="icon" src={Logout}   alt="log out" />
                    <p>Logout</p>
                </div>
                {/* { showPopup ? <button onClick={logout}>logout</button>: "" } */}
            </div>
        </div>
    )
}

export default ProfilePicture;
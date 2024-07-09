import React, { useState, useRef }from 'react'
import './ProfilePicture.css'
import pfp from '../../assets/defaultAvatar.svg'
import useAuth from '../../hooks/useAuth';
import '../../assets/fonts.css'

import ProfileIcon from '../../assets/Icons/Profile.svg'
import Settings from '../../assets/Icons/Settings.svg'
import Guide from '../../assets/Icons/Guide.svg'
import Logout from '../../assets/Icons/Logout.svg'

import useOutsideClick from '../../hooks/useClickOutside';

import {Link} from 'react-router-dom'

function ProfilePicture(){
    const [showPopup, setShowPopup] = useState(false);
    const { logout, user } = useAuth();

    const ref = useRef();
    
    useOutsideClick(ref, () => {
        setShowPopup(false);
    }, ["profile"]);

    return(
        <div className="profile-picture">
            <img className="profile" src ={user.picture ? user.picture : pfp} onClick={()=>{setShowPopup(!showPopup)}}></img>
            <div className={`popup ${showPopup ? "popup-active":""}`} ref={ref}>
                <div className="popup-content">
                    <img className="profile" src ={user.picture ? user.picture : pfp}></img>
                    <div className="profile-info">
                        <h3>{user ? user.username : ""}</h3>
                        <div className="badges">
                            <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                                <p>beta tester</p>
                            </div>
                            <div className="badge" style={{backgroundColor:"#EA4335"}}>
                                <p>admin</p>
                            </div>
                        </div>
                    </div>
                </div>
                <hr />
                <Link to="/profile">
                    <div className="menu-item">
                        <img className="icon" src={ProfileIcon} alt="profile" />
                        <p>Profile</p>
                    </div>
                </Link>
                <Link to="/settings">
                    <div className="menu-item">
                        <img className="icon" src={Settings} alt="settings" />
                        <p>Settings</p>
                    </div>
                </Link>
                <hr />
                <Link to="/">
                    <div className="menu-item">
                        <img className="icon" src={Guide} alt="guide" />
                        <p>Guide</p>
                    </div>
                </Link>
                <hr />
                <Link to="">
                    <div className="menu-item" onClick={logout}>
                        <img className="icon" src={Logout} alt="log out" />
                        <p>Logout</p>
                    </div>
                </Link>
                {/* { showPopup ? <button onClick={logout}>logout</button>: "" } */}
            </div>
        </div>
    )
}

export default ProfilePicture;
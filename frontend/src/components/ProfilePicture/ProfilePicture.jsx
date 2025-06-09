import React, { useState, useRef }from 'react'
import './ProfilePicture.scss'
import pfp from '../../assets/defaultAvatar.svg'
import useAuth from '../../hooks/useAuth';
import '../../assets/fonts.css'

import ProfileIcon from '../../assets/Icons/Profile.svg'
import Settings from '../../assets/Icons/Settings.svg'
import Guide from '../../assets/Icons/Guide.svg'
import Logout from '../../assets/Icons/Logout.svg'
import Badges from '../Badges/Badges';
import Stats from '../../assets/Icons/Stats.svg';

import useOutsideClick from '../../hooks/useClickOutside';

import { useNotification } from '../../NotificationContext';
import {Icon} from '@iconify-icon/react';  
import RPI from '../../assets/Icons/RPI.svg';
import { Squircle } from '@squircle-js/react'

import {Link} from 'react-router-dom'

function ProfilePicture(){
    const [showPopup, setShowPopup] = useState(false);
    const { logout, user } = useAuth();

    const ref = useRef();

    const { addNotification } = useNotification();

    const notYet = () => {
        addNotification({title: "This feature is not yet implemented", message: "The settings feature is coming soon, stay tuned!", type: "error"});
    }
    
    useOutsideClick(ref, () => {
        setShowPopup(false);
    }, ["profile"]);

    return(
        <div className="profile-picture">
            <img className="profile" src ={user.picture ? user.picture : pfp} onClick={()=>{setShowPopup(!showPopup)}}></img>
            <Squircle cornerRadius={15} cornerSmoothing={0} className={`popup ${showPopup ? "popup-active":""}`} ref={ref}>
                <div className="popup-content">
                    <img className="profile" src ={user.picture ? user.picture : pfp}></img>
                    <div className="profile-info">
                        <h3>{user.name ? user.name : user.username}</h3>
                        {/* <div className="badges">
                            <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                                <p>beta tester</p>
                            </div>
                            <div className="badge" style={{backgroundColor:"#EA4335"}}>
                                <p>admin</p>
                            </div>
                        </div> */}
                        <Badges badges={user.tags ? user.tags : []}/>
                    </div>
                </div>
                <hr />
                <p className="section">GENERAL</p>
                <Link to="/profile">
                    <div className="menu-item">
                        <img className="icon" src={ProfileIcon} alt="profile" />
                        <p>Profile</p>
                    </div>
                </Link>
                <Link  to="/settings">
                    <div className="menu-item" >
                        <img className="icon" src={Settings} alt="settings" />
                        <p>Settings</p>
                    </div>
                </Link>
                {user && (user.roles.includes('admin')) && 
                    <Link  to="/create-org">
                        <div className="menu-item" >
                            <img className="icon" src={Settings} alt="settings" />
                            <p>Create an Org</p>
                        </div>
                    </Link>
                }
                {user && (user.roles.includes('admin')||user.roles.includes('oie')) && 
                    <>
                        <hr />
                        <p className="section">ADMINISTRATION</p>
                    </>
                }
                
                {
                    user && user.roles.includes('admin') && 
                    <>
                        <Link to="/admin">
                            <div className="menu-item">
                                <Icon icon="bx:stats" />
                                <p>Analytics</p>
                            </div>
                        </Link>
                    </>
                }
                {
                    user && user.roles.includes('oie') && 
                    <>
                        <Link to="/oie-dashboard">
                            <div className="menu-item">
                                <img className="icon" src={RPI} alt="log out" />
                                <p>OIE Admin</p>
                            </div>
                        </Link>
                    </>
                }
                {
                    user && user.clubAssociations.length > 0 && 
                    <>
                        <hr/>
                        <p className="section">ORGS</p>
                        {user.clubAssociations.map(
                            (org)=>{
                                const url = `/club-dashboard/${org.org_name}`
                                return(
                                    <Link to={`${url}`}>
                                        <div className="menu-item">
                                            <img className="icon" src={org.org_profile_image} alt="" />
                                            <p>{org.org_name}</p>
                                        </div>
                                    </Link>
                                )
                            }
                        )}

                    </>
                }
                {
                    user && user.approvalRoles.length > 0 && 
                    <>
                        <hr/>
                        <p className="section">APPROVALS</p>
                        {user.approvalRoles.map(
                            (role)=>{
                                const url = role === 'root' ? '/root-dashboard' : `/approval-dashboard/${role}` 
                                return(
                                    <Link to={`${url}`}>
                                        <div className="menu-item">
                                            <img className="icon" src={Stats} alt="" />
                                            <p>{role}</p>
                                        </div>
                                    </Link>
                                )
                            }
                        )}
                    </>
                }
                <hr />
                <Link to="">
                    <div className="menu-item" onClick={logout}>
                        <img className="icon" src={Logout} alt="log out" />
                        <p>Logout</p>
                    </div>
                </Link>
            </Squircle>
        </div>
    )
}

export default ProfilePicture;
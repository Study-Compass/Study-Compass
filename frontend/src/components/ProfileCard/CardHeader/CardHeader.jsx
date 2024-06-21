import React from 'react';
import './CardHeader.css';
import WhiteSettings from "../../../assets/Icons/WhiteSettings.svg"
import defaultAvatar from "../../../assets/defaultAvatar.svg"
import ProfilePicture from '../../ProfilePicture/ProfilePicture';



function CardHeader({userInfo}){
    return (
        <div className="card-header">
            <div className="bar">
                <img src={WhiteSettings} alt="settings-icon" />
            </div>
            <div className="personal">
                <div className="pfp">
                    <img src={userInfo.picture} alt="profile-icon" />
                </div>
                <div className="profile-info">
                    <p className="name">{userInfo.username}</p>
                    <p className="user">@username</p>
                    <div className="tags">
                        <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                            <p>beta tester</p>
                        </div>
                        <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                            <p>jeremy</p>
                        </div>
                    </div>
                </div>
            </div>
            
            
            <div className="stats">
                <p><p className="num">123</p>rooms visited</p>
                <p><p className="num">18</p>study partners</p>
                <p><p className="num">500</p>study sessions</p>
                <p><p className="num">1000</p>hours studied</p>
                <p><p className="num">123</p>community contributions</p>
            </div>
        </div>
    )
}


export default CardHeader;
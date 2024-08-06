import React from 'react';
import './CardHeader.css';
import WhiteSettings from "../../../assets/Icons/WhiteSettings.svg"
import defaultAvatar from "../../../assets/defaultAvatar.svg"
import Badges from '../../Badges/Badges';
import '../../ProfilePicture/ProfilePicture.css';

function CardHeader({userInfo, settings}){
    console.log(userInfo);
    return (
        <div className="card-header">
            <div className="bar">
                {settings ? <img src={WhiteSettings} alt="settings-icon" /> : <h2 className="watermark">study compass</h2> }
                
            </div>
            <div className="personal">
                <div className="pfp">
                    <img src={userInfo.picture ? userInfo.picture : defaultAvatar} alt="profile-icon" />
                </div>
                <div className="profile-info">
                    <p className="name">{userInfo.name}</p>
                    <p className="user">@{userInfo.username}</p>
                    {/* <div className="tags">
                        <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                            <p>beta tester</p>
                        </div>
                        <div className="badge" style={{backgroundColor:"#A0C4FF"}}>
                            <p>jeremy</p>
                        </div>
                    </div> */}
                    <Badges badges={userInfo.tags ? userInfo.tags : []}/>
                </div>
            </div>
            
            <div className="stats">
                <p><p className="num">{userInfo.visited ? userInfo.visited.length : 0}</p>rooms visited</p>
                <p><p className="num">{userInfo.partners ? userInfo.partners.length : 0}</p>study partners</p>
                <p><p className="num">{userInfo.sessions ? userInfo.sessions.length : 0}</p>study sessions</p>
                <p><p className="num">{userInfo.hours ? userInfo.hours : 0}</p>hours studied</p>
                <p><p className="num">{userInfo.contributions ? userInfo.contributions : 0}</p>community contributions</p>
            </div>
        </div>
    )
}


export default CardHeader;
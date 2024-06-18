import React from 'react';
import './CardHeader.css';
import Settings from "../../../assets/Icons/Settings.svg"



function CardHeader(){
    return (
        <div className="card-header">
            <div className="bar">
                <img src={Settings} alt="settings-icon" />
            </div>
            <div className="profile-info">
                <p className="name">James Liu</p>
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
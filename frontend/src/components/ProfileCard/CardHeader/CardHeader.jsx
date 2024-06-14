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
                <div className="name">
                    James Liu
                    <p>@username</p>
                </div>
                <p>beta tester</p>
                <p>admin</p>
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
import React from 'react';
import Header from '../../../components/Header/Header';
import rpiLogo from "../../../assets/Icons/rpiLogo.svg";
import person from "../../../assets/Icons/Person.svg";
import calendar from "../../../assets/Icons/Calendar.svg";
import locate from "../../../assets/Icons/Locate.svg";
import './Club.scss';

const ClubDisplay = ({org}) => {
    console.log(org);
    return (
        <div className="club-page page">
            <Header />
            <div className='club-content'>

                <div className="top-header-box">
                    <div className="club-logo">
                        <img src={rpiLogo} alt=""/>
                    </div>
                </div>

                <div className="club-info">

                    <div className="club-header">
                        <h2 className="name">{org.overview.org_name}</h2>
                        <div className="status">Union Recognized</div>
                    </div>

                    <p className="description">
                        {org.overview.org_description}
                    </p>
                    <p className="stats">
                        <img src = {person} alt =""/>
                        250 followers • 50 members
                    </p>
                    <div className="actions">
                        <button>Join</button>
                        <button>Follow</button>
                    </div>

                </div>

                <div className='event-info'>
                    <div className='upcoming'> 

                    </div>
                    
                </div>

                {/* <div className='meeting-schedule'>
                    <h1>meetings schedule</h1>
                    <div className='meetings'>
                        <p>YDSA Weekly GBM</p>

                    </div>

                </div> */}

                <div className="meeting-schedule">
                    <h3>Meetings Schedule</h3>
                    <div className="meeting-card">
                        <div className='title'>
                            <img src={rpiLogo} alt="" className='logo'/>
                            <h4>YDSA Weekly GBM</h4>
                        </div>
                        <div className='info'>
                            <div className='item'> 
                                <img src={calendar} alt="" />
                                <p>Weekly on Thursday at 5:00</p>
                                <img src={locate} alt="" />
                                <p>Phalanx</p>
                            </div>
                            {/* <p>Next Meeting: Thursday 10/24</p> */}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDisplay;

import React from 'react';
import rpiLogo from "../../assets/Icons/rpiLogo.svg";
import person from "../../assets/Icons/Profile.svg";
import calendar from "../../assets/Icons/Calendar.svg";
import locate from "../../assets/Icons/Locate.svg";
import profile from "../../assets/Icons/Profile2.svg";

import Header from '../../components/Header/Header';


import './Org.scss';

const Org = ({ org }) => {
    // const { overview, members, followers } = org;
    
    console.log(org);
    return (
        <div className="org-page page">
            <Header />
            <div className='org-content'>

                <div className="top-header-box">
                    <div className="org-logo">
                        <div className="img-container">
                            <img src={org.overview.org_profile_image ? org.overview.org_profile_image : rpiLogo} alt=""/>
                        </div>
                    </div>
                </div>

                <div className="org-info">
                    <div className="col">
                        <div className="org-header">
                            <h2 className="name">{org.overview.org_name}</h2>
                            {/* <h2 className="name"> Name </h2> */}
                            <div className="status">Union Recognized</div>
                        </div>

                        <p className="description">
                            {org.overview.org_description}
                        </p>
                    </div>
                    
                    <p className="stats">
                        <img src = {person} alt =""/>
                        250 followers • 50 members
                        
                        <img src = {profile} className='mutuals' alt =""/>
                        <img src = {profile} alt =""/>
                        Friend and 1 other are members
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
                    <h3>meetings schedule</h3>
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

export default Org;

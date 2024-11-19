import React from 'react';
import './Club.scss';
import Header from '../../components/Header/Header';
import rpiLogo from "../../assets/Icons/rpiLogo.svg";
import person from "../../assets/Icons/Person.svg"


const Club = () => {
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
                        <h2 className="name">Club Name</h2>
                        <div className="status">Union Recognized</div>
                    </div>

                    <p className="description">
                        description of the club blah blah blah blah blah
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

                {/* Meeting Schedule Section */}
                <div className="meeting-schedule">
                    <h3>Meetings Schedule</h3>
                    <div className="meeting-card">
                        <h4>YDSA Weekly GBM</h4>
                        <div className='info'>
                            <p>Weekly on Thursday at 5:00</p>
                            <p>Phalanx</p>
                            {/* <p>Next Meeting: Thursday 10/24</p> */}

                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default Club;

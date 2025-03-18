import './EventMeeting.scss';
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import calendar from '../../../../assets/calendar.svg';
import left from '../../../../assets/arrow-small-left.svg';

function EventMeeting({openDash}){

    return(
    
        <header className="eventmeeting">
            <div className="back" onClick={openDash}>
                <button>
                    <img src={left} alt="" />
                    back to dashboard
                    <Link to="/club-dashboard" ></Link>
                </button>          
            </div>

            <div className="center">
                <div className="header">
                    <div className="circle">
                    </div>

                    <div className="info">
                        <div className="info title">YDSA Weekly GBM</div>
                        <div className="info time">
                            <img src={calendar} alt="" />
                            Sunday 11/7, 5:00 - 6:00 PM 
                        </div>

                        <div className="info time ongoing" >
                            <div className="circle">
                            </div>
                            ongoing
                        </div>
                    </div>
                </div>



            </div>
            
                <div className="agenda">
                    {/* <div className="agenda body"> */}
                        <h1>
                            agenda
                        </h1> 
                    {/* </div> */}

                </div>

        </header>
    )


    


}

export default EventMeeting;

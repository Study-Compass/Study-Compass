import './EventMeeting.scss';
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import calendar from '../../../../assets/calendar.svg';
import left from '../../../../assets/arrow-small-left.svg';

function EventMeeting(){

    return(
    
        <header className="eventmeeting">
            <div className="back">
                <button>
                    <img src={left} alt="" />
                    back to dashboard
                </button>
                
            </div>

            <div className="center">
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

        </header>
    )


    


}

export default EventMeeting;

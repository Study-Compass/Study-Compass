import './EventMeeting.scss';
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import calendar from '../../../../assets/calendar.svg';
import left from '../../../../assets/arrow-small-left.svg';

function EventMeeting({openDash, clubName, event, picture}){

    const now = new Date();
    const dateStart = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);

    let meetingStatus = "future";
    if (dateStart <= now && now <= dateEnd) {
        meetingStatus = "ongoing";
    } else if (now > dateEnd) {
        meetingStatus = "past";
    }
    const formattedDate = dateStart.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'numeric', 
        day: 'numeric' 
    });

    const formattedStartTime = dateStart.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });

    const formattedEndTime = dateEnd.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
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
                    <img src={picture} alt="" />
                    </div>

                    <div className="info">
                        <div className="info title">{clubName} {event.name}</div>
                        <div className="info time">
                            <img src={calendar} alt="" />
                            {formattedDate}, {formattedStartTime} - {formattedEndTime}
                        </div>

                        <div className="info time status " >
                            <div className="circle">
                            </div>
                            {meetingStatus}
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

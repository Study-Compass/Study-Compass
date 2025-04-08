import './EventMeeting.scss';
import Agenda from '../../Agenda/Agenda';
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import calendar from '../../../../assets/calendar.svg';
import left from '../../../../assets/arrow-small-left.svg';
import qrcode from '../../../../assets/qr_code4.png';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function EventMeeting({openDash, clubName, event, picture}){

    const [showAgenda, setShowAgenda] = useState(false);

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

    if (showAgenda) {
        return <Agenda openDash={openDash} clubName={clubName} event={event} picture={picture} formattedDate={formattedDate} formattedStartTime={formattedStartTime} formattedEndTime={formattedEndTime}/>;
    }
    return(
        // <Agenda openDash={openDash} clubName={clubName} event = {event} picture = {picture}/>
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
                            <h1>
                                attendance
                            </h1> 
                    <div className="bodyA">
                        <h2>
                            <img src={qrcode} alt="" />
                        </h2>
                        <button className="button" onClick={() => setShowAgenda(true)}>
                        {/* onClick={() => handleEventClick(event)} */}
                        <Icon icon="material-symbols:expand-content-rounded" />
                        <p>full screen</p>
                        </button>
                    </div>
                    

                </div>

        </header>
    )


    


}

export default EventMeeting;

import './Agenda.scss';
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import calendar from '../../../assets/calendar.svg';
import left from '../../../assets/arrow-small-left.svg';
import qrcode from '../../../assets/qr_code4.png';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function Agenda({openDash, clubName, event, picture, formattedDate, formattedStartTime, formattedEndTime, showMeeting}){
    

    return(
        <div className="Agenda">
            <div className="back" onClick={showMeeting}>
                <button>
                    <img src={left} alt="" />
                    back to meeting
                </button>          
            </div>
            <div className='Middle'>
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
                        </div>

                </div>
                <div className='subtitle'>
                    <p>
                        scan for attendance
                    </p>
                    <h2>
                        <img src={qrcode} alt="" />
                    </h2>
                </div>

                

            </div>

        </div>
    )


    


}

export default Agenda;

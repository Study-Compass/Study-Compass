import './Agenda.scss';
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import calendar from '../../../assets/calendar.svg';
import left from '../../../assets/arrow-small-left.svg';
import qrcode from '../../../assets/qr_code4.png';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function Agenda({openDash, clubName, event, picture}){

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
                            
                        </div>

                        <div className="info time status " >
                            <div className="circle">
                            </div>
                            
                        </div>
                    </div>
                </div>



            </div>
            
                <div className="agenda">
                            <h1>
                                AGENDA
                            </h1> 
                    <div className="bodyA">
                        <h2>
                            <img src={qrcode} alt="" />
                        </h2>
                        <button className="button" >
                        {/* onClick={() => handleEventClick(event)} */}
                        <Icon icon="material-symbols:expand-content-rounded" />
                        <p>full screen</p>
                        </button>
                    </div>
                    

                </div>

        </header>
    )


    


}

export default Agenda;

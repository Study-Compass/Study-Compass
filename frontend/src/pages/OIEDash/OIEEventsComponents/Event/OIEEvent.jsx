import React, { useState, useEffect } from 'react';
import './OIEEvent.scss';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../components/Popup/Popup';
import OIEFullEvent from '../FullEvent/OIEFullEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import FullEvent from '../../../../components/EventsViewer/EventsGrid/EventsColumn/FullEvent/FullEvent';

import defaultAvatar from '../../../../assets/defaultAvatar.svg';

function OIEEvent({event, showStatus=false, refetch}){
    const [popupOpen, setPopupOpen] = useState(false);
    const [edited, setEdited] = useState(false);
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        setPopupOpen(true);
    }

    const onPopupClose = () => {
        setPopupOpen(false);
        if(edited){
            refetch();
            setEdited(false);
        }
    }

    const date = new Date(event.start_time);

    const statusMessages = {
        'Not Applicable' : ["Doesnt meet approval criteria","not-applicable"],
        "Approved" : ["OIE Approved", "approved"]
    }

    return(
        <div className="oie-event-component" >
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content no-padding no-styling oie"} waitForLoad={true} >
                {event.OIEStatus === "Pending" ?
                 <OIEFullEvent event={event} refetch={refetch} setEdited={setEdited}/>
                :
                <FullEvent event={event}/>
                }
            </Popup>
            <div className="info">
                {
                    showStatus && <div className={`oie-status ${statusMessages[event.OIEStatus][1]}`}><p>{statusMessages[event.OIEStatus][0]}</p></div>
                }
                <h1>{event.name}</h1>
                {/* <p>{event.location }</p> */}
                {/* display date in day of the week, month/day */}
                <div className="row">
                    <img src={event.hostingId.image ? event.hostingId.image : defaultAvatar} alt="" />
                    <p className="user-name">{event.hostingId.name}</p>
                    <div className="level">
                        student
                    </div>
                </div>
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <p>{date.toLocaleString('default', {weekday: 'long'})} {date.toLocaleString('default', {month: 'numeric'})}/{date.getDate()}</p>
                </div>
                <div className="row">
                    <Icon icon="fluent:location-28-filled" />
                    <p>{event.location}</p>
                </div>
            </div>
            <button className="button" onClick={() => handleEventClick(event)}>
                <Icon icon="material-symbols:expand-content-rounded" />
                <p>details</p>
            </button>
        </div>
    );

}

export default OIEEvent;
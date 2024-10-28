import React, { useState, useEffect } from 'react';
import './OIEEvent.scss';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../components/Popup/Popup';
import OIEFullEvent from '../FullEvent/OIEFullEvent';

function OIEEvent({event}){
    const [popupOpen, setPopupOpen] = useState(false);
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        setPopupOpen(true);
    }

    const onPopupClose = () => {
        setPopupOpen(false);
    }

    const date = new Date(event.date);
    

    return(
        <div className="event-component" onClick={() => handleEventClick(event)}>
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content"}>
                <OIEFullEvent event={event}/>
            </Popup>
            {event.image && <img src={event.image} alt="" />}
            <div className="info">
                <h1>{event.name}</h1>
                {/* <p>{event.location }</p> */}
                {/* display date in day of the week, month/day */}
                <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                {/* time */}
                <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>
            </div>
        </div>
    );

}

export default OIEEvent;
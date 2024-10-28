import React, { useState, useEffect } from 'react';
import './Event.css';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../Popup/Popup';
import FullEvent from '../FullEvent/FullEvent'

function Event({event}){
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
                <FullEvent event={event}/>
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

export default Event;
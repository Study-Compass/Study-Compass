import React, { useState, useEffect } from 'react';
import './Event.scss';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../Popup/Popup';
import FullEvent from '../FullEvent/FullEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function Event({event}){
    const [popupOpen, setPopupOpen] = useState(false);
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        setPopupOpen(true);
    }

    const onPopupClose = () => {
        setPopupOpen(false);
    }

    const date = new Date(event.start_time);
    

    return(
        <div className="event-component" onClick={() => handleEventClick(event)}>
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content no-styling no-padding"}>
                <FullEvent event={event}/>
            </Popup>
            {event.image && <img src={event.image} alt="" />}
            <div className="info">
                <h1>{event.name}</h1>
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}   {date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                </div>
                <div className="row">
                    <Icon icon="fluent:location-28-filled" />
                    <p>{event.location}</p>
                </div>
            </div>
        </div>
    );

}

export default Event;
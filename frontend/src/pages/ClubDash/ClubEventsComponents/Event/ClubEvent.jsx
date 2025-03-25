import React, { useState, useEffect } from 'react';
import './ClubEvent.scss';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../components/Popup/Popup';
import ClubFullEvent from '../FullEvent/ClubFullEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import defaultAvatar from '../../../../assets/defaultAvatar.svg';

function ClubEvent({event, onGoing, onExpand}){
    const [popupOpen, setPopupOpen] = useState(false);
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        onExpand(event);
    }

    const onPopupClose = () => {
        setPopupOpen(false);
    }

    const date = new Date(event.start_time);


    const getDifferenceHours = () => {
        const diffMs = new Date().getTime() - date.getTime(); 
        return Math.floor(diffMs / (1000 * 60 * 60));

    }
    const getDifferenceMinutes = () => {
        const diffMs = new Date().getTime() - date.getTime(); 
        return Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); 
    }
    

    return(
        <div className="club-event-component" >
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content"}>
                <ClubFullEvent event={event}/>
            </Popup>
            <div className="info">
                <h1 className="title">{event.name}</h1>
                {/* <p>{event.location }</p> */}
                {/* display date in day of the week, month/day */}
                {onGoing && (
                    <div className="ongoing-badge">
                     <span>&#8226;</span>
                    <p>ongoing for {getDifferenceHours()}:{String(getDifferenceMinutes()).padStart(2, "0")}</p>
                    </div>
                )}
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <p>{date.toLocaleString('default', {weekday: 'long'})} {date.toLocaleString('default', {month: 'numeric'})}/{date.getDate()}</p>
                </div>
                <div className="row">
                    <Icon icon="fluent:location-28-filled" />
                    <p>{event.location}</p>
                </div>
                {/* time */}
                {/* <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p> */}
            </div>
            <button className="button" onClick={() => handleEventClick(event)}>
                <Icon icon="material-symbols:expand-content-rounded" />
                <p>details</p>
            </button>
        </div>
    );

}

export default ClubEvent;
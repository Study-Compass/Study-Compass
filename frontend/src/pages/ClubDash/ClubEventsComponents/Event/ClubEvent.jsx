import React, { useState, useEffect } from 'react';
import './ClubEvent.scss';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../components/Popup/Popup';
import ClubFullEvent from '../FullEvent/ClubFullEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import defaultAvatar from '../../../../assets/defaultAvatar.svg';

function ClubEvent({event}){
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
        <div className="club-event-component" >
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content"}>
                <clubFullEvent event={event}/>
            </Popup>
            <div className="info">
                <h1>{event.name}</h1>
                {/* <p>{event.location }</p> */}
                {/* display date in day of the week, month/day */}
                <div className="row">
                    <img src={event.user_id.image ? event.user_id.image : defaultAvatar} alt="" />
                    <p className="user-name">{event.user_id.name}</p>
                </div>
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <p>{date.toLocaleString('default', {weekday: 'long'})} {date.toLocaleString('default', {month: 'numeric'})}/{date.getDate()}</p>
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
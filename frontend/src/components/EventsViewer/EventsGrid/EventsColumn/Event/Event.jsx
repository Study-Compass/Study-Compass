import React, { useState, useEffect } from 'react';
import './Event.scss';
import { useNavigate } from 'react-router-dom';
import Popup from '../../../../Popup/Popup';
import FullEvent from '../FullEvent/FullEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import defaultAvatar from '../../../../../assets/defaultAvatar.svg'

function Event({event}){
    const renderHostingStatus = () => {
        let hostingImage = '';
        let hostingName = '';
        let level = '';
        if(!event.hostingType){
            return;
        }
        if(event.hostingType === "User"){
            hostingImage = event.hostingId.image ? event.hostingId.image : defaultAvatar;
            hostingName = event.hostingId.name;
            if(event.hostingId.roles.includes("developer")){
                level = "Developer";
            } else if(event.hostingId.roles.includes("oie")){
                level = "Faculty";
            } else {
                level = "Student";
            }
        } else {
            hostingImage = event.hostingId.org_profile_image;
            hostingName = event.hostingId.org_name;
            level = "Organization";
        }
        return (
            <div className={`row hosting ${level.toLowerCase()}`}>
                <img src={hostingImage} alt="" />
                <p className="user-name">{hostingName}</p>
                <div className={`level ${level.toLowerCase()}`}>
                    {level}
                </div>
            </div>
        );
    }
    const [popupOpen, setPopupOpen] = useState(false);
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        setPopupOpen(true);
    }

    const onPopupClose = () => {
        setPopupOpen(false);
    }

    const date = new Date(event.start_time);

    const isOngoing = () => {
        const now = new Date();
        return date.getTime() < now.getTime() && date.getTime() + event.duration * 60000 > now.getTime();
    }

    const isInactive = () => {
        const now = new Date();
        return date.getTime() + event.duration * 60000 < now.getTime();
    }
    

    return(
        <div className={`event-component ${isOngoing() ? 'ongoing' : isInactive() ? 'inactive' : ''}`} onClick={() => handleEventClick(event)}>
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content no-styling no-padding"}>
                <FullEvent event={event}/>
            </Popup>
            {event.image && <img src={event.image} alt="" />}
            <div className="info">
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <p><b>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</b>   {date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                </div>
                <h1>{event.name}</h1>
                {renderHostingStatus()}
                <div className="row event-description">
                    <p>{event.description}</p>
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
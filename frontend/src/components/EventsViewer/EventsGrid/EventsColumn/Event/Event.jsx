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
                <img src={hostingImage} alt={`${hostingName} profile picture`} />
                <p className="user-name">{hostingName}</p>
                <div className={`level ${level.toLowerCase()}`} aria-label={`Hosted by ${level}`}>
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

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleEventClick(event);
        }
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

    const getEventStatus = () => {
        if (isOngoing()) return 'ongoing';
        if (isInactive()) return 'inactive';
        return 'upcoming';
    }

    const formatTime = (date) => {
        return date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true});
    }

    const formatDate = (date) => {
        return `${date.toLocaleString('default', {weekday: 'long'})}, ${date.toLocaleString('default', {month: 'long'})} ${date.getDate()}`;
    }

    const eventStatus = getEventStatus();
    const statusText = {
        'ongoing': 'Event is currently happening',
        'inactive': 'Event has ended',
        'upcoming': 'Event is upcoming'
    };

    return(
        <article 
            className={`event-component ${eventStatus}`} 
            onClick={() => handleEventClick(event)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`${event.name} event. ${statusText[eventStatus]}. ${formatTime(date)} on ${formatDate(date)} at ${event.location}`}
            aria-describedby={`event-description-${event._id}`}
        >
            <Popup isOpen={popupOpen} onClose={onPopupClose} customClassName={"wide-content no-styling no-padding"}>
                <FullEvent event={event}/>
            </Popup>
            {event.image && <img src={event.image} alt={`Event image for ${event.name}`} />}
            <div className="info">
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" aria-hidden="true" />
                    <time dateTime={date.toISOString()}>
                        <strong>{formatTime(date)}</strong> {formatDate(date)}
                    </time>
                </div>
                <h2>{event.name}</h2>
                {renderHostingStatus()}
                <div className="row event-description" id={`event-description-${event._id}`}>
                    <p>{event.description}</p>
                </div>
                <div className="row">
                    <Icon icon="fluent:location-28-filled" aria-hidden="true" />
                    <address>{event.location}</address>
                </div>
            </div>
        </article>
    );

}

export default Event;
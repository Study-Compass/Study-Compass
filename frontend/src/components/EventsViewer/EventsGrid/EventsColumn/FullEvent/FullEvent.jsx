import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../../assets/StarGradient.png'
import MockPoster from '../../../../../assets/MockPoster.png'
import defaultAvatar from '../../../../../assets/defaultAvatar.svg'

function FullEvent({ event }){
    const navigate = useNavigate();

    console.log(event);

    const handleEventClick = () => {
        navigate(`/create-event`);
    }
    const date = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);
    
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

    return(
        <div className="full-event">
                { event.image &&
                    <div className="image-container">
                        <img src={event.image ? event.image : ""} alt="" className=""/>
                    </div>
                }
            <div className="event-content">
                <h1>{event.name}</h1>
                {renderHostingStatus()}
                <div className="row">
                    <div className="row event-detail">
                        <Icon icon="heroicons:calendar-16-solid" />
                        <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                    </div>
                    <div className="row event-detail">
                        <Icon icon="heroicons:clock-16-solid" />
                        <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})} -  {dateEnd.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>
                    </div>
                    <div className="row event-detail">
                        <Icon icon="fluent:location-28-filled" />
                        <p>{event.location}</p>
                    </div>
                </div>
                <div className="row event-description">
                    <h3>Description</h3>
                    <p>{event.description}</p>
                </div>
            </div>
            <img src={StarGradient} alt="" className="gradient" />
        </div>
    );

}

export default FullEvent;
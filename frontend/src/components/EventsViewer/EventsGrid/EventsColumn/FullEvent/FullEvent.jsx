import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../../assets/StarGradient.png'

function FullEvent({ event }){
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/create-event`);
    }
    const date = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);

    return(
        <div className="full-event">
            <div className="image">
                <img src={event.image} alt="" />
            </div>
            <div className="event-content">
                <h1>{event.name}</h1>
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <div className="col">
                        <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                        <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})} -  {dateEnd.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>
                    </div>
                </div>
                <div className="row">
                    <Icon icon="fluent:location-28-filled" />
                    <p>{event.location[0]}</p>
                </div>
            </div>
            <img src={StarGradient} alt="" className="gradient" />
        </div>
    );

}

export default FullEvent;
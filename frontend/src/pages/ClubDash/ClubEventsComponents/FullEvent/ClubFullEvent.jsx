import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClubFullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../assets/StarGradient.png';

function ClubFullEvent({ event }){
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/create-event`);
    }
    const date = new Date(event.date);

    return(
        <div className="full-event">
            <div className="image">
                <img src={event.image} alt="" />
            </div>
            <div className="content">
            <h1>{event.name}</h1>
                {/* <p>{event.location }</p> */}
                {/* display date in day of the week, month/day */}
                <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                {/* time */}
                <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>

            </div>
            <img src={StarGradient} alt="" className="gradient" />
        </div>
    );

}

export default ClubFullEvent;
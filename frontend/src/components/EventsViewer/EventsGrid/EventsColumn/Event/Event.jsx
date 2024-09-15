import React, { useState, useEffect } from 'react';
import './Event.css';
import { useNavigate } from 'react-router-dom';

function Event({event}){
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        navigate(`/event/${event.id}`);
    }

    const date = new Date(event.date);
    

    return(
        <div className="event-component" onClick={() => handleEventClick(event)}>
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
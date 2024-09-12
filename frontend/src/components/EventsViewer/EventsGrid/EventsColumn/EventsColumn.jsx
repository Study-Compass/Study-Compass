import React, { useState, useEffect } from 'react';
import './EventsGrid.css';

function EventsColumn({events}){
    const navigate = useNavigate();

    const handleEventClick = (event) => {
        navigate(`/event/${event.id}`);
    }

    return(
        <div className="events-column"> 
            {events.map(event => {
                return <div className="event" onClick={() => handleEventClick(event)}>
                    <h1>{event.title}</h1>
                    <p>{event.description}</p>
                    <p>{event.location}</p>
                    <p>{event.date}</p>
                    <p>{event.time}</p>
                </div>
            })}
        </div>
    );
}

export default EventsColumn;
import React, { useState, useEffect } from 'react';
import './EventsColumn.css';
import Event from './Event/Event.jsx';
import CreateEvent from './CreateEventButton/CreateEvent.jsx';

function EventsColumn({events, triggerAnimation}){
    return(
        <div className={ `events-column ${triggerAnimation && "active"}`}> 
            {events.map((event, index) => {
                if(event.type === "create event"){
                    return <CreateEvent/>
                }
                return <Event event={event} key={`event-${index}`}/>
            })}
        </div>
    );
}

export default EventsColumn;
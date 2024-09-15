import React, { useState, useEffect } from 'react';
import './EventsColumn.css';
import Event from './Event/Event.jsx';

function EventsColumn({events, triggerAnimation}){
    return(
        <div className={ `events-column ${triggerAnimation && "active"}`}> 
            {events.map(event => {
                return <Event event={event}/>
            })}
        </div>
    );
}

export default EventsColumn;
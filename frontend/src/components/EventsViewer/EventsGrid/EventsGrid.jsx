import React, { useState, useEffect } from 'react';
import './EventsGrid.css';

import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth.js';
import EventsColumn from './EventsColumn/EventsColumn.jsx';

function EventsGrid({events}){
    const navigate = useNavigate();

    
    return(
        <div className="events-grid"> 
            <EventsColumn events={events}/>
            <EventsColumn events={events}/>
            <EventsColumn events={events}/>
        </div>
    );
}

export default EventsGrid;
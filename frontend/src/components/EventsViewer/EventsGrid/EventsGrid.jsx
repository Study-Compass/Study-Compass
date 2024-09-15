import React, { useState, useEffect } from 'react';
import './EventsGrid.css';

import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth.js';
import EventsColumn from './EventsColumn/EventsColumn.jsx';

function EventsGrid({events}){
    const navigate = useNavigate();
    const [eventsArray, setEventsArray] = useState([[], [], []]);
    const [animations, setAnimations] = useState([false, false, false]);
    
    //populate eventsArray
    useEffect(() => {
        if(events.length > 0){
            let newEventsArray = [[], [], []];
            events.forEach((event, index) => {
                newEventsArray[index % 3].push(event);
            });
            setEventsArray(newEventsArray);
        }
    }, [events]);
    
    //on mount
    useEffect(() => {
        //stagger effect
        for(let i = 0; i < 3; i++){
            setTimeout(() => {
                setAnimations((prev) => {
                    let newAnimations = [...prev];
                    newAnimations[i] = true;
                    return newAnimations;
                });
            }, i * 200);
        }
    }, []);
    
    return(
        <div className="events-grid"> 
            <EventsColumn events={eventsArray[0]} triggerAnimation={animations[0]}/>
            <EventsColumn events={eventsArray[1]} triggerAnimation={animations[1]}/>
            <EventsColumn events={eventsArray[2]} triggerAnimation={animations[2]}/>
        </div>
    );
}

export default EventsGrid;
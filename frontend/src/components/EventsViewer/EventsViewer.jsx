import React, { useState, useEffect } from 'react';
import './EventsViewer.css';

import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { useNotification } from '../../NotificationContext.js';

import EventsGrid from './EventsGrid/EventsGrid.jsx';

import { getAllEvents } from './EventHelpers.js'

function EventsViewer(){
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addNotification } = useNotification();

    const options = ["all", "study events", "campus events"];
    const authenticatedOptions = ["my events", "friends events"];
    const [chosen, setChosen] = useState("all");
    const [events, setEvents] = useState([]);
    const [displayEvents, setDisplayEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try{
                const allEvents = await getAllEvents();
                //sort by date
                allEvents.sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
                setEvents(allEvents);
            } catch (error){
                console.log(error);
                addNotification({title: "Error", message: "Failed to fetch events"});
            }

        }
        fetchEvents();
    }, []);

    useEffect(() => {
        if(chosen === "all"){
            setDisplayEvents(events);
        } else {
            console.log(events);
            //new event to trigger 
            const newEvents = events.filter(event => {
                return event.type === chosen;
            });
            setDisplayEvents(newEvents);
        }
    }, [chosen, events]);

    useEffect(() => {
        console.log(displayEvents);
    }, [displayEvents]);

    const handleOptionClick = (e) => {
        const option = e.target.innerText;
        if(chosen === option){
            setChosen("");
        } else {
            setChosen(option);
        }
    }

    return(
        <div className="events-viewer"> 
            <div className="events-options">
                {options.map(option => {
                    return <button className={`events-option ${chosen === option ? "active" : ""}`} onClick={handleOptionClick}>{option}</button>
                })}
                {isAuthenticated && authenticatedOptions.map(option => {
                    return <button className={`events-option ${chosen === option ? "active" : ""}`} onClick={handleOptionClick}>{option}</button>
                })}
            </div>
            <EventsGrid events={displayEvents}/>
        </div>
    );
}

export default EventsViewer;


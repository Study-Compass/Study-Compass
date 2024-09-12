import React, { useState, useEffect } from 'react';
import './EventsViewer.css';

import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { useNotification } from '../../NotificationContext.js';

import { getAllEvents } from './EventHelpers.js'

function EventsViewer({events}){
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addNotification } = useNotification();

    const options = ["all", "study events", "campus events"];
    const authenticatedOptions = ["my events", "friends events"];
    const [chosen, setChosen] = useState("");

    useEffect(() => {
        const fetchEvents = async () => {
            try{
                const events = await getAllEvents();
            } catch (error){
                console.log(error);
                addNotification({title: "Error", message: "Failed to fetch events"});
            }

        }
        fetchEvents();
    }, []);

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
        </div>
    );
}

export default EventsViewer;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateEvent(){
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/create-event`);
    }

    return(
        <div className="event-component" onClick={handleEventClick}>
            <div className="info">
                <h1>Create Event</h1>
            </div>
        </div>
    );

}

export default CreateEvent;
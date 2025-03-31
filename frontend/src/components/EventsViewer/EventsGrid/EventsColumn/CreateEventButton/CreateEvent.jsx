import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEventButton.scss';
import {Icon} from '@iconify-icon/react';  
import GradientButtonCover from '../../../../../assets/GradientButtonCover.png';

function CreateEventButton({origin = ""}){
    const navigate = useNavigate();

    const handleEventClick = () => {
        if(origin === ""){
            navigate(`/create-event`);
        } else {
            navigate(`/create-event`, {state: {origin}});
        }
    }

    return(
        <div className="event-component create" onClick={handleEventClick}>
            <div className="info">
                <Icon icon="ph:plus-bold" className="create-icon"/>
                <h1>create event</h1>
            </div>
            <div className="gradient-cover">
                <img src={GradientButtonCover} alt="" />
            </div>
        </div>
    );

}

export default CreateEventButton;
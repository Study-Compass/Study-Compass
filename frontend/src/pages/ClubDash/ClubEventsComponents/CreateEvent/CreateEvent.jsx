import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEvent.scss';
import {Icon} from '@iconify-icon/react';  
import GradientButtonCover from '../../../../../assets/GradientButtonCover.png';

function CreateEvent(){
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/create-event`);
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

export default CreateEvent;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OIEFullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../assets/OIE-Gradient2.png';
import MockPoster from '../../../../assets/MockPoster.png';


function OIEFullEvent({ event }){
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/create-event`);
    }
    const date = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);

    return(
        <div className="full-event oie">
            <div className="tabs">
                <div className="tab">
                    <Icon icon="fluent:edit-16-filled" />
                    <p>info</p>
                </div>
            </div>
            <div className="image">
                <img src={event.image ? event.image : MockPoster } alt="" />
            </div>
            <div className="content">
                <h1>{event.name}</h1>
                <div className="row">
                    <Icon icon="heroicons:calendar-16-solid" />
                    <div className="col">
                        <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                        <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})} -  {dateEnd.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>
                    </div>
                </div>
                <div className="row">
                    <Icon icon="fluent:location-28-filled" />
                    <p>{event.location}</p>
                </div>
            </div>
            <img src={StarGradient} alt="" className="gradient" />
        </div>
    );

}

export default OIEFullEvent;
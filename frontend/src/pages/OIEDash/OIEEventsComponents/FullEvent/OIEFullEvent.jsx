import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './OIEFullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../assets/OIE-Gradient2.png';
import MockPoster from '../../../../assets/MockPoster.png';
import { useFetch } from '../../../../hooks/useFetch';


function OIEFullEvent({ event }){
    const { data, loading, error } = useFetch('/config');
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/create-event`);
    }
    const date = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);

    const [tab, setTab] = useState("info");


    return(
        <div className="full-event oie">
            <div className="tabs">
                <div className={`tab ${tab === "info" && "selected"}`} onClick={()=>setTab('info')} >
                    <div className="tab-content">
                        <Icon icon="akar-icons:info-fill" />
                        <p>info</p>
                    </div>
                </div>
                <div className={`tab ${tab === "check" && "selected"}`} onClick={()=> setTab('check')}>
                    <div className="tab-content">
                        <Icon icon="icon-park-solid:check-one" />
                        <p>check</p>
                    </div>
                </div>
            </div>
            <div className={`event-info `}>
                <div className={`info ${tab === "info" && "visible"}`}>
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
                <div className={`check ${tab === "check" && "visible"}`}>
                    <h1>Checklist</h1>
                    <div className="checklist">
                        {!loading && data.config.checklist.map((item, index) => (
                            <div className="check-item" key={index}>
                                <h2>{item.title}</h2>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

}

export default OIEFullEvent;
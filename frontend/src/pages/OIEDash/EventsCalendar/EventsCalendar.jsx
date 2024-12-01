import React, { useEffect, useState, useRef } from 'react';
import Switch from '../../../components/Switch/Switch';
import './EventsCalendar.scss';
import Month from './Month/Month';


function EventsCalendar({expandedClass}){
    const [view, setView] = useState(0); //0: month, 1: week:, 2: day, 3: list
    const [contentHeight, setContentHeight] = useState(100);
    const contentRef = useRef(null);

    useEffect(() => {
        if(contentRef.current){
            setContentHeight(contentRef.current.clientHeight);
        }
    },[contentRef.current]);

    return (
        <div className={`events-calendar ${expandedClass}`}>
            <div className="header">
                <h1>Events Calendar</h1>
                <Switch options={["month", "week", "day", "list"]} onChange={setView} />

            </div>
            <div className="content" ref={contentRef}>
                {
                    view === 0 && <Month height={contentHeight}/>
                }
            </div>
        </div>
    )
}

export default EventsCalendar;
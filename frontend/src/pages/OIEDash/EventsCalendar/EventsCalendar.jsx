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

    const changeToWeek = (week) => {
        console.log(week);
        setView(1);
    }

    return (
        <div className={`events-calendar ${expandedClass}`}>
            <div className="header">
                <h1>December 2024</h1>
                <Switch options={["month", "week", "day", "list"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>

            </div>
            <div className="content" ref={contentRef}>
                {
                    view === 0 && <Month height={contentHeight} changeToWeek={changeToWeek}/>
                }
            </div>
        </div>
    )
}

export default EventsCalendar;
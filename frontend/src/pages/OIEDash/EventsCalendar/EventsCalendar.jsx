import React, { useEffect, useState, useRef } from 'react';
import Switch from '../../../components/Switch/Switch';
import './EventsCalendar.scss';
import Month from './Month/Month';
import Week from './Week/Week';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function EventsCalendar({expandedClass}){
    const [view, setView] = useState(0); //0: month, 1: week:, 2: day, 3: list
    const [contentHeight, setContentHeight] = useState(100);
    const contentRef = useRef(null);

    useEffect(() => {
        if(contentRef.current){
            setContentHeight(contentRef.current.clientHeight-50);
        }
    },[contentRef.current]);

    const changeToWeek = (week) => {
        console.log(week);
        setView(1);
    }

    const changeToDay = (day) => {
        console.log(day);
        setView(2);
    }

    return (
        <div className={`events-calendar ${expandedClass}`}>
            <Switch options={["month", "week", "day", "list"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>

            <div className="content" ref={contentRef}>
                {
                    view === 0 && <Month height={contentHeight} changeToWeek={changeToWeek} view={view} setView={setView}/>
                }
                {
                    view === 1 && <Week height={contentHeight} changeToDay={changeToDay}/>
                }

            </div>
        </div>
    )
}

export default EventsCalendar;
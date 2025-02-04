import React, { useEffect, useState, useRef } from 'react';
import Switch from '../../../components/Switch/Switch';
import './EventsCalendar.scss';
import Month from './Month/Month';
import Week from './Week/Week';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

const events = [
    {
      "_id": { "$oid": "674b6d55b299e3918e461236" },
      "name": "Example Event",
      "type": "campus",
      "location": "Carnegie Building 106",
      "start_time": { "$date": "2024-11-24T18:00:00.000Z" },
      "end_time": { "$date": "2024-11-24T23:30:00.000Z" }
    },
    {
        "_id": { "$oid": "674b6d55b299e3918e461236" },
        "name": "Example Event",
        "type": "campus",
        "location": "Carnegie Building 106",
        "start_time": { "$date": "2024-11-24T21:00:00.000Z" },
        "end_time": { "$date": "2024-11-24T23:30:00.000Z" }
    },
    {
        "_id": { "$oid": "674b6d55b299e3918e461236" },
        "name": "Example Event",
        "type": "campus",
        "location": "Carnegie Building 106",
        "start_time": { "$date": "2024-11-24T15:00:00.000Z" },
        "end_time": { "$date": "2024-11-24T21:30:00.000Z" }
    },
      
    // Add more events here
  ];

function EventsCalendar({expandedClass}){
    const [view, setView] = useState(0); //0: month, 1: week:, 2: day, 3: list
    const [contentHeight, setContentHeight] = useState(100);
    const [start, setStart] = useState("2024-12-01");
    const contentRef = useRef(null);

    useEffect(() => {
        console.log(start);
    }, [start]);

    useEffect(() => {
        if(contentRef.current){
            setContentHeight(contentRef.current.clientHeight-50);
        }
    },[contentRef.current]);

    const changeToWeek = (week) => {
        //calculate start date of week
        console.log(week);
        setStart(week);
        setView(1);
    }

    const changeToDay = (day) => {
        console.log(day);
        setView(2);
    } 

    const startOfWeek = new Date('2024-11-24'); // Start of the week

    return (
        <div className={`events-calendar ${expandedClass}`}>
            <Switch options={["month", "week", "day", "list"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>

            <div className="content" ref={contentRef}>
                {
                    view === 0 && <Month height={contentHeight} changeToWeek={changeToWeek} view={view} setView={setView}/>
                }
                {
                    view === 1 && <Week height={contentHeight} changeToDay={changeToDay} />
                }
            </div>
        </div>
    )
}

export default EventsCalendar;
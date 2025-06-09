import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import './Week.scss';
import WeeklyCalendar from './WeeklyCalendar/WeeklyCalendar';
import Switch from '../../../../components/Switch/Switch';

function Week({ height, changeToDay, start = new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), startingText = "", nav=true , filter, setView = () => {}, view = 1, showSwitch = true }) {
    const initialStartDate = typeof start === 'string' ? new Date(start) : start;
    const initialEndDate = new Date(initialStartDate);
    initialEndDate.setDate(initialEndDate.getDate() + 6);
    initialEndDate.setHours(23, 59, 59, 999);

    const [startOfWeek, setStartOfWeek] = useState(initialStartDate);
    const [endOfWeek, setEndOfWeek] = useState(initialEndDate);


    const formattedDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const updateWeek = (days) => {
        setStartOfWeek((prev) => {
            const newStart = new Date(prev);
            newStart.setDate(newStart.getDate() + days);
            return newStart;
        });

        setEndOfWeek((prev) => {
            const newEnd = new Date(prev);
            newEnd.setDate(newEnd.getDate() + days);
            newEnd.setHours(23, 59, 59, 999);
            return newEnd;
        });
    };

    const url = `/get-events-by-range?start=${encodeURIComponent(startOfWeek.toISOString())}&end=${encodeURIComponent(endOfWeek.toISOString())}&filter=${filter}`;
    const events = useFetch(url);



    return (
        <>
            <div className="weekly-header">
                <div className="time-period">
                    {nav &&
                        <div className="arrows">
                            <div className="left-arrow" onClick={() => updateWeek(-7)}>
                                <Icon icon="charm:chevron-left" />
                            </div>
                            <div className="right-arrow" onClick={() => updateWeek(7)}>
                                <Icon icon="charm:chevron-right" />
                            </div>  
                        </div>
                    }
                    <h1>{startingText}{nav && `${formattedDate(startOfWeek)} to ${formattedDate(endOfWeek)}`}</h1>
                </div>
                {showSwitch && <Switch options={["month", "week", "day"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>}
            </div>
            <div className="week" style={{ height: `${height}` }}>
                <WeeklyCalendar 
                    events={events.data ? events.data.events : []} 
                    startOfWeek={startOfWeek} 
                    height={"100%"} 
                    dayClick={(date) => {
                        if (changeToDay) {
                            changeToDay(date);
                        }
                    }} 
                />
            </div>
        </>
    );
}

export default Week;

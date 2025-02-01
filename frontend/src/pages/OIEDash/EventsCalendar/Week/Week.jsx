import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import './Week.scss';
import WeeklyCalendar from './WeeklyCalendar/WeeklyCalendar';

function Week({ height, changeToDay, start = '2024-12-09', startingText = "" }) {
    const initialStartDate = new Date(start);
    const initialEndDate = new Date(initialStartDate);
    initialEndDate.setDate(initialEndDate.getDate() + 6);

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
            return newEnd;
        });
    };

    const url = `/get-events-by-range?start=${encodeURIComponent(startOfWeek.toISOString())}&end=${encodeURIComponent(endOfWeek.toISOString())}`;
    const events = useFetch(url);

    useEffect(() => {
        console.log(events);
    }, [events]);

    // if (events.loading || !events.data) {
    //     return <div>Loading...</div>;
    // }

    return (
        <>
            <div className="header">
                <div className="time-period">
                    <div className="arrows">
                        <Icon icon="charm:chevron-left" onClick={() => updateWeek(-7)} />
                        <Icon icon="charm:chevron-right" onClick={() => updateWeek(7)} />
                    </div>
                    <h1>{startingText}{formattedDate(startOfWeek)} to {formattedDate(endOfWeek)}</h1>
                </div>
            </div>
            <div className="week">
                <WeeklyCalendar 
                    events={events.data ? events.data.events : []} 
                    startOfWeek={startOfWeek} 
                    height={height} 
                    changeToDay={changeToDay} 
                />
            </div>
        </>
    );
}

export default Week;

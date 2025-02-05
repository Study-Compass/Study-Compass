import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import DailyCalendar from './DailyCalendar/DailyCalendar';
import { use } from 'react';

function Day({ height, start = new Date(new Date().setHours(0, 0, 0, 0)) , startingText = "", nav=true }) {
    const initialStartDate = typeof start === 'string' ? new Date(start) : start;

    const [day, setDay] = useState(initialStartDate);

    const formattedDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const updateDay = (days) => {
        setDay((prev) => {
            const newStart = new Date(prev);
            newStart.setDate(newStart.getDate() + days);
            return newStart;
        });

    };

    const getEndOfDay = (date) => {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return end;
    };

    const url = `/get-events-by-range?start=${encodeURIComponent(day.toISOString())}&end=${encodeURIComponent(getEndOfDay(day).toISOString())}`;
    const events = useFetch(url);
    

    return (
        <>
            <div className="header">
                <div className="time-period">
                    {nav &&
                        <div className="arrows">
                            <Icon icon="charm:chevron-left" onClick={() => updateDay(-1)} />
                            <Icon icon="charm:chevron-right" onClick={() => updateDay(1)} />
                        </div>
                    }
                    <h1>{startingText}{nav && `${formattedDate(day)}`}</h1>
                </div>
            </div>
            <div className="week">
                <DailyCalendar 
                    events={events.data ? events.data.events : []} 
                    selectedDay={day} 
                    height={height} 
                />
            </div>
        </>
    );
}

export default Day;

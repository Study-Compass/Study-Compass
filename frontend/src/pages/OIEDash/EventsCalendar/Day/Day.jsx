import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import DailyCalendar from './DailyCalendar/DailyCalendar';
import Switch from '../../../../components/Switch/Switch';
import './Day.scss';

function Day({ height, start = new Date(new Date().setHours(0, 0, 0, 0)) , startingText = "", nav=true, setView = () => {}, view = 2, showSwitch = true, blockedEvents = [] }) {
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
    
    // Filter blocked events to only show those within the current day
    const dayBlockedEvents = blockedEvents.filter(event => {
        const eventStart = new Date(event.start_time);
        const eventDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        return eventDay.getTime() === currentDay.getTime();
    });

    // Combine regular events with blocked events
    const combinedEvents = [
        ...(events.data ? events.data.events : []),
        ...dayBlockedEvents
    ];

    return (
        <>
            <div className="daily-header">
                <div className="time-period">
                    {nav &&
                        <div className="arrows">
                            <Icon icon="charm:chevron-left" onClick={() => updateDay(-1)} />
                            <Icon icon="charm:chevron-right" onClick={() => updateDay(1)} />
                        </div>
                    }
                    <h1>{startingText}{nav && `${formattedDate(day)}`}</h1>
                </div>
                {showSwitch && <Switch options={["month", "week", "day"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>}
            </div>
            <div className="week" style={{ height: `${height}` }}>
                <DailyCalendar 
                    events={combinedEvents} 
                    selectedDay={day} 
                    height={'100%'} 
                />
            </div>
        </>
    );
}

export default Day;

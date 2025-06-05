import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import DailyCalendar from './DailyCalendar/DailyCalendar';
import Switch from '../../../../components/Switch/Switch';
import './Day.scss';

function Day({ height, start = new Date(new Date().setHours(0, 0, 0, 0)) , startingText = "", nav=true, setView = () => {}, view = 2, showSwitch = true }) {
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
            <div className="daily-header">
                <div className="time-period">
                    {nav &&
                        <div className="arrows">
                            <div className="left-arrow">
                                <Icon icon="charm:chevron-left" onClick={() => updateDay(-1)} />
                            </div>
                            <div className="right-arrow">
                                <Icon icon="charm:chevron-right" onClick={() => updateDay(1)} />
                            </div>
                        </div>
                    }
                    <h1>{startingText}{nav && `${formattedDate(day)}`}</h1>
                </div>
                {showSwitch && <Switch options={["month", "week", "day"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>}
            </div>
            <div className="week" style={{ height: `${height}` }}>
                <DailyCalendar 
                    events={events.data ? events.data.events : []} 
                    selectedDay={day} 
                    height={'100%'} 
                />
            </div>
        </>
    );
}

export default Day;

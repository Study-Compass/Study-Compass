import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import './Week.scss';
import WeekComponent from '../../../../components/NewCalendar/WeekComponent/WeekComponent';
import WeeklyCalendar from './WeeklyCalendar/WeeklyCalendar';

function Week({height, changeToDay, start='2024-12-02'}){
    console.log(start);
    //get end date
    const startDate = new Date(start);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const url = `/get-events-by-range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const events = useFetch(url);

    useEffect(() => {
        console.log(events);
    }, [events]);

    const formattedDate = (date) => {
        const d = new Date(date);
        return `${d.toDateString().split(" ")[1]} ${d.toDateString().split(" ")[2]}`;
    }

    if(events.loading || !events.data){
        return <div>Loading...</div>
    }

    return(
        <>
            <div className="header">
                <div className="time-period">
                    <div className="arrows">
                        <Icon icon="charm:chevron-left" />
                        <Icon icon="charm:chevron-right" />
                    </div>
                    {/* date formatted <Month Name> <Day Number> */}
                    <h1>{formattedDate(start)} to {formattedDate(end)}</h1>
                </div>
            </div>
            <div className="week">
                <WeeklyCalendar events={events.data.events} startOfWeek={startDate} height={height} changeToDay={changeToDay}/>
            </div>
        </>
    )
}

export default Week;
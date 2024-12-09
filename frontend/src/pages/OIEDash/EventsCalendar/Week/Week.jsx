import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from '../../../../hooks/useFetch';
import './Week.scss';
import WeekComponent from '../../../../components/NewCalendar/WeekComponent/WeekComponent';

function Week({height, changeToDay, start='"2024-12-08"', end='2024-12-14"'}){
    const url = `/get-events-by-range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const events = useFetch(url);

    useEffect(() => {
        console.log(events);
    }, [events]);

    return(
        <>
            <div className="header">
                <div className="time-period">
                    <div className="arrows">
                        <Icon icon="charm:chevron-left" />
                        <Icon icon="charm:chevron-right" />
                    </div>
                    <h1>dec</h1>
                </div>
            </div>
            <div className="week">
                <WeekComponent height={height} start={start} events={events} changeToDay={changeToDay}/>
            </div>
        </>
    )
}

export default Week;
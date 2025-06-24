import React, {useState} from 'react';

import './EventCalenderWrapper.scss';

// calender components
import MonthDisplay from '../../pages/OIEDash/EventsCalendar/Month/MonthDisplay';
import WeeklyCalendar from '../../pages/OIEDash/EventsCalendar/Week/WeeklyCalendar/WeeklyCalendar';
import DailyCalendar from '../../pages/OIEDash/EventsCalendar/Day/DailyCalendar/DailyCalendar';
import Switch from '../Switch/Switch';
import {Icon} from '@iconify-icon/react/dist/iconify.mjs';


const getSunday = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
}
    

function EventCalenderWrapper({roomList = [], start = new Date()}) {
    console.log(roomList);
    const [startDate, setStartDate] = useState(getSunday(start));
    const [view, setView] = useState(0);

    return (
        <div className='event-calender-wrapper'>
            <div className="monthly-header">
                <div className="time-period">
                    <div className="arrows">
                        <div className="left-arrow" onClick={()=>{}}>
                            <Icon icon="charm:chevron-left" /> 
                        </div>
                        <div className="right-arrow" onClick={()=>{}}>
                            <Icon icon="charm:chevron-right" />
                        </div>
                    </div>
                    {/* <h1>{month === currentMonth && year === currentYear ? (<b>{getMonthName(month)}</b>): getMonthName(month)} {year}</h1> */}
                </div>
                <Switch options={["month", "week", "day"]} onChange={()=>{}} selectedPass={view} setSelectedPass={setView}/>
            </div>
            <container className="calendar-element-wrapper">
                {view === 0 ? (
                    <MonthDisplay month={startDate.getMonth()+1} year={startDate.getFullYear()} roomList={roomList} onWeekClick={()=>{}} currentDay={new Date().getDate} currentMonth={new Date().getMonth()+1}/>
                ) : view === 1 ? (
                    <WeeklyCalendar startOfWeek={startDate} roomList={roomList} events={[]}/>
                ) : (
                    <DailyCalendar selectedDay={startDate} roomList={roomList} events={[]} />
                )}
            </container>
        </div>
    );
}

export default EventCalenderWrapper;
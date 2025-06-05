import React, { useState } from 'react';
import './Month.scss';
import { useFetch } from '../../../../hooks/useFetch';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import MonthDisplay from './MonthDisplay';
import Switch from '../../../../components/Switch/Switch';

const getMonthName = (month) => {
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];
    return months[month - 1];
};

function Month({ height, changeToWeek, filter, showSwitch = true, setView = () => {}, view = 0 }) {

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(2025);
    // const filterParam = encodeURIComponent(JSON.stringify(filter)); this caused some problems
    const url = `/get-events-by-month?month=${month}&year=${year}&filter=${filter}`;
    const events = useFetch(url);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentDay = new Date().getDate();

    const nextMonth = () => {
        setMonth(month === 12 ? 1 : month + 1);
        setYear(month === 12 ? year + 1 : year);
    }

    const prevMonth = () => {
        setMonth(month === 1 ? 12 : month - 1);
        setYear(month === 1 ? year - 1 : year);
    }

    return (
        <>
            <div className="monthly-header">
                <div className="time-period">
                    <div className="arrows">
                        <div className="left-arrow">
                            <Icon icon="charm:chevron-left" onClick={prevMonth}/>
                        </div>
                        <div className="right-arrow">
                            <Icon icon="charm:chevron-right" onClick={nextMonth}/>
                        </div>
                    </div>
                    <h1>{month === currentMonth && year === currentYear ? (<b>{getMonthName(month)}</b>): getMonthName(month)} {year}</h1>
                </div>
                {showSwitch && <Switch options={["month", "week", "day"]} onChange={setView} selectedPass={view} setSelectedPass={setView}/>}

            </div>
            <MonthDisplay 
                month={month}
                year={year}
                events={events.data?.events}
                height={height}
                currentMonth={currentMonth}
                currentYear={currentYear}
                currentDay={currentDay}
                onWeekClick={changeToWeek}
            />
        </>
    );
}

export default Month;
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
    const url = `/get-events-by-month?month=${month}&year=${year}&filter=${JSON.stringify(filter)}`;
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

    const handleKeyDown = (event, direction) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (direction === 'next') {
                nextMonth();
            } else {
                prevMonth();
            }
        }
    }

    const isCurrentMonth = month === currentMonth && year === currentYear;
    const monthYearText = `${getMonthName(month)} ${year}`;

    return (
        <>
            <header className="monthly-header">
                <div className="time-period">
                    <div className="arrows" role="group" aria-label="Month navigation">
                        <button 
                            className="left-arrow" 
                            onClick={prevMonth}
                            onKeyDown={(e) => handleKeyDown(e, 'prev')}
                            aria-label={`Previous month, ${month === 1 ? 'December' : getMonthName(month - 1)} ${month === 1 ? year - 1 : year}`}
                            type="button"
                        >
                            <Icon icon="charm:chevron-left" aria-hidden="true" /> 
                        </button>
                        <button 
                            className="right-arrow" 
                            onClick={nextMonth}
                            onKeyDown={(e) => handleKeyDown(e, 'next')}
                            aria-label={`Next month, ${month === 12 ? 'January' : getMonthName(month + 1)} ${month === 12 ? year + 1 : year}`}
                            type="button"
                        >
                            <Icon icon="charm:chevron-right" aria-hidden="true" />
                        </button>
                    </div>
                    <h1 id="month-year-display">
                        {isCurrentMonth ? (
                            <strong>{getMonthName(month)}</strong>
                        ) : (
                            getMonthName(month)
                        )} {year}
                    </h1>
                </div>
                {showSwitch && (
                    <Switch 
                        options={["month", "week", "day"]} 
                        onChange={setView} 
                        selectedPass={view} 
                        setSelectedPass={setView}
                        ariaLabel="Calendar view options"
                    />
                )}
            </header>
            <MonthDisplay 
                month={month}
                year={year}
                events={events.data?.events}
                height={height}
                currentMonth={currentMonth}
                currentYear={currentYear}
                currentDay={currentDay}
                onWeekClick={changeToWeek}
                monthYearText={monthYearText}
            />
        </>
    );
}

export default Month;
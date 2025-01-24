import React, { useEffect, useState } from 'react';
import './Month.scss';
import { useFetch } from '../../../../hooks/useFetch';
import MonthEvent from './MonthEvent/MonthEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Switch from '../../../../components/Switch/Switch';

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};
  
const getFirstDayOfWeek = (month, year) => {
    return new Date(year, month - 1, 1).getDay(); // Subtract 1 from the month
};

const getMonthName = (month) => {
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];
    return months[month - 1];
};


function Month({ height, changeToWeek }) {
    const [month, setMonth] = useState(12);
    const [year, setYear] = useState(2024);
    const url = `/get-events-by-month?month=${month}&year=${year}`;
    const events = useFetch(url);
    const daysInMonth = getDaysInMonth(month, year); // Total days in the given month
    const firstDayOfWeek = getFirstDayOfWeek(month, year); // Starting weekday
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => (
        <div key={`empty-${i}`} className="calendar__day is-disabled"></div>
    ));

    const getEventByDay = (day) => {
        if (events.loading || !events.data) return [];
        return events.data.events.filter((event) => {
            const eventDate = new Date(event.start_time);
            return eventDate.getDate() === day;
        });
    };

    const dayCells = Array.from({ length: daysInMonth }, (_, i) => (
        <div key={`day-${i}`} className="calendar__day">
            <div className="day-header">
                <p>{i + 1}</p>
            </div>
            <div className="events">
                {getEventByDay(i + 1).map((event) => (
                    <MonthEvent key={event._id} event={event} show={i===10} />
                ))}
            </div>
        </div>
    ));

    // Fill in remaining empty cells
    const totalCells = emptyCells.length + dayCells.length;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells; // Ensure a complete grid
    const remainingEmptyCells = Array.from({ length: remainingCells }, (_, i) => (
        <div key={`empty-last-${i}`} className="calendar__day is-disabled"></div>
    ));

    // Group cells into rows
    const allCells = [...emptyCells, ...dayCells, ...remainingEmptyCells];
    const rows = [];
    for (let i = 0; i < allCells.length; i += 7) {
        rows.push(allCells.slice(i, i + 7));
    }

    useEffect(() => {
        console.log(month);
    }, [month]);

    const nextMonth = () => {
        setMonth(month === 12 ? 1 : month + 1);
        setYear(month === 12 ? year + 1 : year);
    }

    const prevMonth = () => {
        setMonth(month === 1 ? 12 : month - 1);
        setYear(month === 1 ? year - 1 : year);
    }

    const getFirstDayOfWeekFromRow = (rowIndex) => {
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const firstDayOfRow = new Date(year, month - 1, 1 + (rowIndex * 7) - firstDayOfWeek);
        return firstDayOfRow;
    };

    return (
        <>
            <div className="header">
                <div className="time-period">
                    <div className="arrows">
                        <Icon icon="charm:chevron-left" onClick={prevMonth}/>
                        <Icon icon="charm:chevron-right" onClick={nextMonth}/>
                    </div>
                    <h1>{month === currentMonth && year === currentYear ? (<b>{getMonthName(month)}</b>): getMonthName(month)} {year}</h1>
                </div>
            </div>
            <div className="month" style={{ height: `${height}px` }}>
                <div className="calendar-header">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                        <div key={day} className="day">
                            <p>{day}</p>
                        </div>
                    ))}
                </div>
                <div className="calendar">
                    {rows.map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="calendar__row" onClick={()=>changeToWeek(getFirstDayOfWeekFromRow(rowIndex))}>
                            {row}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Month;
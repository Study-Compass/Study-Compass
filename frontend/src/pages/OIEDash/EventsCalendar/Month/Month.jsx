import React, { useEffect, useState } from 'react';
import './Month.scss';
import { useFetch } from '../../../../hooks/useFetch';
import MonthEvent from './MonthEvent/MonthEvent';

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};
  
const getFirstDayOfWeek = (month, year) => {
    return new Date(year, month - 1, 1).getDay(); // Subtract 1 from the month
};

function Month({ height, month = 12, year = 2024, changeToWeek }) {
    const url = `/get-events-by-month?month=${month}&year=${year}`;
    const events = useFetch(url);
    const daysInMonth = getDaysInMonth(month, year); // Total days in the given month
    const firstDayOfWeek = getFirstDayOfWeek(month, year); // Starting weekday

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
                    <MonthEvent key={event.id} event={event} show={i===10} />
                ))}
            </div>
        </div>
    ));

    // Fill in remaining empty cells
    const totalCells = emptyCells.length + dayCells.length;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells; // Ensure a complete grid
    const remainingEmptyCells = Array.from({ length: remainingCells }, (_, i) => (
        <div key={`empty-${i}`} className="calendar__day is-disabled"></div>
    ));

    // Group cells into rows
    const allCells = [...emptyCells, ...dayCells, ...remainingEmptyCells];
    const rows = [];
    for (let i = 0; i < allCells.length; i += 7) {
        rows.push(allCells.slice(i, i + 7));
    }

    return (
        <div className="month" style={{ height: `${height}px` }}>
            {/* Headers */}
            <div className="calendar-header">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="day">
                        <p>{day}</p>
                    </div>
                ))}
            </div>
            <div className="calendar">
                {rows.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="calendar__row" onClick={()=>changeToWeek(rowIndex)}>
                        {row}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Month;
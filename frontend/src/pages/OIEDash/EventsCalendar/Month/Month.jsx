import React, { useEffect, useState } from 'react';
import './Month.scss';

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};
  
const getFirstDayOfWeek = (month, year) => {
    return new Date(year, month - 1, 1).getDay(); // Subtract 1 from the month
};

function Month({ height, month=11, year=2024 }){
    const daysInMonth = getDaysInMonth(month, year); // Total days in the given month
    const firstDayOfWeek = getFirstDayOfWeek(month, year); // Starting weekday

    const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => (
        <div key={`empty-${i}`} className="calendar__day is-disabled"></div>
    ));
    
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => (
        <div key={`day-${i}`} className="calendar__day">
            <div className="day-header">
                <p>{i + 1}</p>
            </div>
            <div className="events">
                
            </div>
        </div>
    ));

    return(
        <div className="month" style={{height: `${height}px`}}>
            {/* Headers */}
            <div className="calendar-header">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="day">
                        <p>{day}</p>
                    </div>
                ))}
            </div>
            <div className="calendar">

                {/* Days */}
                {emptyCells.concat(dayCells)}
            </div>
        </div>
    )
}

export default Month;
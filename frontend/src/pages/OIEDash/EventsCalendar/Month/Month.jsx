import React, { useEffect, useState } from 'react';
import './Month.scss';

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};
  
const getFirstDayOfWeek = (month, year) => {
    return new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
};

function Month({height, month=11, year=2024}){
    const daysInMonth = getDaysInMonth(month, year); // Total days in the given month
    const firstDayOfWeek = getFirstDayOfWeek(month, year); // Starting weekday

    const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => (
        <div key={`empty-${i}`} className="calendar__day is-disabled"></div>
    ));
    
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => (
        <div key={`day-${i}`} className="calendar__day">
            {i + 1}
        </div>
    ));

    return(
        <div className="month" style={{height: `${height}px`}}>
            {/* Headers */}
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
        <div key={day} className="calendar__header">
          {day}
        </div>
      ))}
      {/* Days */}
      {emptyCells.concat(dayCells)}
        </div>
    )
}

export default Month;
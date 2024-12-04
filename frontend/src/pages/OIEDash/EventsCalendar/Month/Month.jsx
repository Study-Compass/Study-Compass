import React, { useEffect, useState } from 'react';
import './Month.scss';
import { useFetch } from '../../../../hooks/useFetch';

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};
  
const getFirstDayOfWeek = (month, year) => {
    return new Date(year, month - 1, 1).getDay(); // Subtract 1 from the month
};

function Month({ height, month=12, year=2024 }){
    const url = `/get-events-by-month?month=${month}&year=${year}`;
    const events = useFetch(url);
    const daysInMonth = getDaysInMonth(month, year); // Total days in the given month
    const firstDayOfWeek = getFirstDayOfWeek(month, year); // Starting weekday

    const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => (
        <div key={`empty-${i}`} className="calendar__day is-disabled"></div>
    ));

    //takes in a day as an integer and returns all events that occur on that day
    const getEventByDay = (day) => {
        if(events.loading || !events.data) return [];
        return events.data.events.filter((event) => {
            const eventDate = new Date(event.start_time);
            console.log(eventDate.getDate());
            return eventDate.getDate() === day;
        });
    }
    
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => (
        <div key={`day-${i}`} className="calendar__day">
            <div className="day-header">
                <p>{i + 1}</p>
            </div>
            <div className="events">
                {getEventByDay(i + 1).map((event) => (
                    <div key={event._id} className="event">
                        <p>{event.name}</p>
                    </div>
                ))}
            </div>
        </div>
    ));



    //fill in the rest of the month with empty cells
    const totalCells = emptyCells.length + dayCells.length;
    const remainingCells = 35 - totalCells; //refactor to be dynamic
    const remainingEmptyCells = Array.from({ length: remainingCells }, (_, i) => (
        <div key={`empty-${i}`} className="calendar__day is-disabled"></div>
    ));

    useEffect(() => {
        console.log(events);
    }, [events]);

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
                {remainingEmptyCells}
            </div>
        </div>
    )
}

export default Month;
import React, { useState, useEffect } from 'react';
import './WeekComponent.scss';
import DayComponent from '../DayComponent/DayComponent';

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getMonthName = (month) => {
    const months = [
        "Jan", "Feb", "Mar", "April",
        "May", "June", "July", "Aug",
        "Sept", "Oct", "Nov", "Dec"
    ];
    return months[month];
};

const getDayEvents = (events, day) => {
    if (events.loading || !events.data) return [];
    return events.data.events.filter((event) => {
        const eventDate = new Date(event.start_time);
        return eventDate.getDate() === day;
    });
};

const getDaysArray = (startDate, weekends) => {
    const startDayIndex = new Date(startDate).getDay();
    const totalDays = weekends ? 7 : 5;
    const filteredDays = weekends ? daysOfWeek : daysOfWeek.slice(1, 6);
    // add dummy first entry for time column
    return ["Time", ...Array.from({ length: totalDays }, (_, i) => {
        const dayIndex = (startDayIndex + i) % 7;
        return filteredDays.includes(daysOfWeek[dayIndex]) ? daysOfWeek[dayIndex] : null;
    }).filter(Boolean)];
};

const getDateNumbers = (startDate, length) => {
    //add 1 day to the start date
    const start = new Date(startDate);
    const dateNumbers = [];
    for (let i = 0; i < length; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dateNumbers.push({
            date: date.getDate(),
            month: date.getMonth()
        });
    }
    return dateNumbers;
};

function WeekComponent({ height, start, events, weekends = true, changeToDay }) {
    const [days, setDays] = useState([]);
    const [dateNumbers, setDateNumbers] = useState([]);
    const [month, setMonth] = useState("");

    useEffect(() => {
        const correctedStart = new Date(start); 

        const newDays = getDaysArray(correctedStart, weekends);
        setDays(newDays);

        const newDateNumbers = getDateNumbers(correctedStart, newDays.length);
        setDateNumbers(newDateNumbers);

        setMonth(getMonthName(correctedStart.getMonth()));
    }, [start, weekends]);

    return (
        <div className={`week ${weekends && 'weekend'}`} style={{ height: `${height}px` }}>
        <div className="calendar-header">
            {days.map((day, index) => (
                //add condition if day == "time"
                day === "Time" ?
                <div key={day} className="day">
                    <p>
                        EST
                    </p>
                </div> 
                :
                <div key={day} className="day">
                    <p>
                        {day} <b>{dateNumbers[index]?.date}</b>
                    </p>
                </div>
                
            ))}
        </div>
            <div className="content">
                {days.map((day, index) => (
                    <DayComponent
                        key={index}
                        day={day}
                        height={height}
                        date={dateNumbers[index]?.date}
                        events={getDayEvents(events, dateNumbers[index]?.date)}
                        changeToDay={changeToDay}
                    />
                ))}
            </div>
        </div>
    );
}

export default WeekComponent;

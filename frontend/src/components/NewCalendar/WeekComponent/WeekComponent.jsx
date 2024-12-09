import React, { useState, useEffect } from 'react';
import './WeekComponent.scss';
import { getMonth } from 'date-fns';

const getMonthName = (month) => {
    const months = [
        "Jan", "Feb", "Mar", "April",
        "May", "June", "July", "Aug",
        "Sept", "Oct", "Nov", "Dec"
    ];
    return months[month - 1];
}

function WeekComponent({ height, start, events, weekends=true, changeToDay }) {
    const [days, setDays] = useState(weekends ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Mon", "Tue", "Wed", "Thu", "Fri"]);
    const [dateNumbers, setDateNumbers] = useState([]);
    const [month, setMonth] = useState(getMonthName(new Date(start).getMonth() + 1));

    const getEventByDay = (day) => {
        if (events.loading || !events.data) return [];
        return events.data.events.filter((event) => {
            const eventDate = new Date(event.start_time);
            return eventDate.getDate() === day;
        });
    }

    useEffect(() => {
        const dateNumbers = Array.from({ length: days.length }, (_, i) => {
            return new Date(start).getDate() + i;
        });
        setDateNumbers(dateNumbers);
    }, [start, days]);

    useEffect(() => {
        console.log(month);

    }, [month]);

    return (
        <div className="week" style={{height:`${height}px`}}>
            {days.map((day, index) => {
                return (
                    <div className="day" key={day}>
                        <h1>{day}{dateNumbers[index]}</h1>
                        {/* <button onClick={() => changeToDay(day)}>Day</button> */}
                    </div>
                );
            })}
        </div>
    );
}

export default WeekComponent;
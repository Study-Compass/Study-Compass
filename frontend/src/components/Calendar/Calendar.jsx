import React, { useRef } from 'react';
import './Calendar.css';
import DayColumn from './DayColumn/DayColumn';

function Calendar({data}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const eventColors = useRef(new Map()).current;

    return (
            <div className="Calendar">
                <div className="Calendar-header">
                    <p>monday</p>
                    <p>tuesday</p>
                    <p>wednesday</p>
                    <p>thursday</p>
                    <p>friday</p>
                </div>
                <div className="Time-grid">
                    {days.map((day) => (
                        <DayColumn day={day} dayEvents={data["weekly_schedule"][day]} eventColors={eventColors} />
                    ))}
                </div>
            </div>
    );

}

export default Calendar
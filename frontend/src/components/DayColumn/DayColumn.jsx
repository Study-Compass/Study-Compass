import { useState, useEffect, useRef } from 'react';
import './DayColumn.css';

function DayColumn({day, dayEvents}){
    
    function calculateRowStart(time){
        const [hour, minute] = time.split(':');
        return (hour - 8) * 2 + (minute === '30' ? 1 : 0) + 1;
    }
    function calculateRowEnd(time){
        const [hour, minute] = time.split(':');
        return (hour - 8) * 2 + (minute === '30' ? 1 : 0) + 2;
    }

    return (
        <div className="DayColumn">
            {dayEvents.map(event => {
                const rowStart = calculateRowStart(event.start_time);
                const rowEnd = calculateRowEnd(event.end_time);

                return (
                    <div 
                        className="event"
                        style={{
                            gridRowStart: rowStart,
                            gridRowEnd: rowEnd,
                        }}
                    >
                        {event.title}
                    </div>
                );
            })}
        </div>

    );
}

export default DayColumn;
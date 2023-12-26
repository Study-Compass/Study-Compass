import { useState, useEffect, useRef } from 'react';
import './DayColumn.css';
import '../../assets/fonts.css'

function DayColumn({day, dayEvents}){
    
    function calculateTime(time){
        const [hour, minute] = time.split(':');
        return (hour - 8) * 2 + (minute === '30' ? 1 : 0) + 1;
    }

    function Grid(){
        return (            
            <div className="grid">
                <div className="grid-item" style={{gridRowStart:1, gridRowEnd:3}}></div>
                <div className="grid-item" style={{gridRowStart:3, gridRowEnd:5}}></div>
                <div className="grid-item" style={{gridRowStart:5, gridRowEnd:7}}></div>
                <div className="grid-item" style={{gridRowStart:7, gridRowEnd:9}}></div>
                <div className="grid-item" style={{gridRowStart:9, gridRowEnd:11}}></div>
                <div className="grid-item" style={{gridRowStart:11, gridRowEnd:13}}></div>
                <div className="grid-item" style={{gridRowStart:13, gridRowEnd:15}}></div>
                <div className="grid-item" style={{gridRowStart:15, gridRowEnd:17}}></div>
                <div className="grid-item" style={{gridRowStart:17, gridRowEnd:19}}></div>
                <div className="grid-item" style={{gridRowStart:19, gridRowEnd:21}}></div>
                <div className="grid-item" style={{gridRowStart:21, gridRowEnd:23}}></div>
                <div className="grid-item" style={{gridRowStart:23, gridRowEnd:25}}></div>
                <div className="grid-item" style={{gridRowStart:25, gridRowEnd:27}}></div>

            </div>
        );
    }

    return (
        <div className="DayColumn">
            <Grid />
            {dayEvents.map(event => {
                const rowStart = calculateTime(event.start_time);
                const rowEnd = calculateTime(event.end_time);

                return (
                    <div 
                        className="event"
                        style={{
                            gridRowStart: rowStart,
                            gridRowEnd: rowEnd,
                        }}
                    >
                        {event.class_name}
                    </div>
                );
            })}
        </div>

    );
}

export default DayColumn;
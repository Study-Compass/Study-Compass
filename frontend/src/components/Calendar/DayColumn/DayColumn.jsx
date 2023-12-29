import React, { useRef } from 'react';
import './DayColumn.css';
import '../../../assets/fonts.css'
import TimeLabelColumn from '../TimeLabelColumn/TimeLabelColumn';

function DayColumn({day, dayEvents, eventColors}){
    
    function calculateTime(time){
        const [hour, minute] = time.split(':');
        return (hour - 8) * 2 + (minute === '30' ? 1 : 0) + 1;
    }

    const colors = ['#B1E6B0', '#D6BCDD', '#BDB2FF', '#FFD6A5', '#FDFFB6', '#A0C4FF', '#FFC6FF'];

    // ref to store the event-to-color mapping

    // function to get the color for an event
    function getColorForEvent(eventName) {
        if (eventColors.has(eventName)) {
            return eventColors.get(eventName);
        } else {
            const color = colors[eventColors.size % colors.length];
            eventColors.set(eventName, color);
            return color;
        }
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

    if(day === "S"){
        return (
            <div className="DayColumn" style={{width:'auto'}}>
                <TimeLabelColumn />
            </div>
        );
    }
    return (
        <div className="DayColumn">
            <Grid />
            {dayEvents.map(event => {
                const rowStart = calculateTime(event.start_time);
                const rowEnd = calculateTime(event.end_time);
                const color = getColorForEvent(event.class_name);
                return (
                    <div 
                        className="event"
                        style={{
                            gridRowStart: rowStart,
                            gridRowEnd: rowEnd,
                            backgroundColor: color,
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
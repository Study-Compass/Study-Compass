import React, { useState } from 'react';
import './DayColumn.css';
import '../../assets/fonts.css'
import TimeLabelColumn from '../TimeLabelColumn/TimeLabelColumn';

function DayColumn({day, dayEvents, eventColors}){
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);

    const handleMouseDown = (gridPosition) => {
        setSelectionStart(gridPosition);
        console.log(gridPosition);
        setSelectionEnd(gridPosition+2);
        setIsSelecting(true);
    };

    const handleMouseMove = (gridPosition) => {
        if (isSelecting) {
            setSelectionEnd(gridPosition);
        }
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
        // Here you can handle the creation of a new event or finalize the selection
    };
    function calculateTime(time){
        const [hour, minute] = time.split(':');
        return (hour - 7) * 2 + (minute === '30' ? 1 : 0) + 1;
    }

    const colors = ['#B1E6B0', '#D6BCDD', '#BDB2FF', '#F1F3A8' , '#FFD6A5', '#A0C4FF', '#FFC6FF','#B4C4AE','#A2ABAB'];

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
    
    const start_times = [];
    const end_times = [];

    function Grid(){
        const gridItems = [];
        for (let i = 1; i <= 56; i += 2) { // Assuming 14 time slots
            gridItems.push(
                <div 
                    className={`grid-item ${(i-1) % 4  === 0 ? '' : 'noborder'}`} 
                    style={{gridRowStart: i, gridRowEnd: i + 2}}
                    onMouseDown={() => handleMouseDown(i)}
                    onMouseMove={() => handleMouseMove(i)}
                    key={i}
                ></div>
            );
        }
        let selectionOverlay = null;
        if (isSelecting && selectionStart && selectionEnd) {
            selectionOverlay = (
                <div 
                    className="selection-overlay"
                    style={{
                        gridRowStart: selectionStart,
                        gridRowEnd: selectionEnd
                    }}
                ></div>
            );
        }

        return (
            <div className="grid" onMouseUp={handleMouseUp}>
                {gridItems}
                {selectionOverlay}
            </div>
        );
    }

    if(day === "S"){
        return (
            <div className="DayColumn TimeColumn" >
                <TimeLabelColumn />
            </div>
        );
    }
    
    return (
        <div className="DayColumn">
            <Grid />
            {dayEvents.map((event,index) => {
                const rowStart = calculateTime(event.start_time);
                const rowEnd = calculateTime(event.end_time);
                const color = getColorForEvent(event.class_name);

                let timelabel = false;

                if(!start_times.includes(rowStart)){
                    start_times.push(rowStart);
                } else {
                    return "";
                }

                if(!end_times.includes(rowEnd)){
                    end_times.push(rowEnd);
                } else {
                    return "";
                }
                
                if(rowEnd - rowStart >= 4){
                    timelabel = true;
                }

                if(event.class_name === "loading"){
                    return (
                        <div 
                            key={event.id || `event-${index}`}
                            className="event shimmer"
                            style={{
                                gridRowStart: rowStart,
                                gridRowEnd: rowEnd,
                                backgroundColor: color,
                            }}
                            >
                        </div>

                    );
                }

                return (
                    <div 
                        className="event"
                        style={{
                            gridRowStart: rowStart,
                            gridRowEnd: rowEnd,
                            backgroundColor: color,
                        }}
                    >
                        {timelabel && <p className="time">{event.start_time} - {event.end_time}</p>}
                        <p className="class-name">{event.class_name}</p>
                    </div>
                );
            })}
        </div>

    );
}

export default DayColumn;
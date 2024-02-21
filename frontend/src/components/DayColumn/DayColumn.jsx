import React, { useEffect, useState } from 'react';
import './DayColumn.css';
import '../../assets/fonts.css'
import TimeLabelColumn from '../TimeLabelColumn/TimeLabelColumn';

function DayColumn({day, dayEvents, eventColors, empty, add, remove, queries}){
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [loading, setLoading] = useState(false);

    const dates = ["M", "T", "W", "R", "F"];

    const isToday = dates.indexOf(day) === new Date().getDay() -1;

    useEffect(() => {
        setLoading(false);
    }, [dayEvents]);

    const handleMouseDown = (gridPosition) => {
        if(!empty){
            return
        }
        setSelectionStart(gridPosition);
        setSelectionEnd(gridPosition+2);
        setIsSelecting(true);
    };

    const handleMouseMove = (gridPosition) => {
        if(!empty){
            return
        }
        if (isSelecting) {
            setSelectionEnd(gridPosition+2);
        }
    };

    const handleMouseUp = () => {
        if(!empty){
            return
        }
        setIsSelecting(false);
        // Here you can handle the creation of a new event or finalize the selection

        if(selectionStart > selectionEnd){
            let temp = selectionStart;
            setSelectionStart(selectionEnd);
            setSelectionEnd(temp);
        }

        const timeslot = {
            class_name: "search",
            start_time: stringifyTime((selectionStart-1)/4 + 7),
            end_time: stringifyTime((selectionEnd-1)/4 + 7),
        }
        console.log(timeslot);
        add(day, timeslot);
    };

    function stringifyTime(time){
        const hour = Math.floor(time);
        const minute = time % 1 === 0.5 ? '30' : '00';
        return hour*60 + parseInt(minute);
    }

    function minutesToTime(minutes){
        let hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if(hours > 12){
            hours -= 12;
        }
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }

    function calculateTime(time){
        // const [hour, minute] = time.split(':');
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        return (hours - 7) * 2 + (minutes === 30 ? 1 : 0) + 1;
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
        const date = new Date();
        const currentHour = date.getHours();
        const currentGrid = (currentHour - 7) * 4 + 1;
        for (let i = 1; i <= 60; i += 2) { // Assuming 14 time slots
            gridItems.push(
                <div 
                    className={`grid-item ${!isSelecting ? "":"no-interaction"} ${(i-1) % 4  === 0 ? '' : 'noborder'} ${i === currentGrid && isToday? 'redborder' : ''}`} 
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
                    if(!loading){
                        setLoading(true);
                        console.log("loading")
                    }
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
                if(loading){
                    setLoading(false);
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
                        {timelabel ? <p className="time">{minutesToTime(event.start_time)} - {minutesToTime(event.end_time)}</p>: ""}
                        <p className="class-name">{event.class_name}</p>
                    </div>
                );
            })}
            {queries[day] ? 
                queries[day].map((query) => {
                    const rowStart = calculateTime(query.start_time);
                    const rowEnd = calculateTime(query.end_time);
                    let timelabel;

                    if(rowEnd - rowStart >= 2){
                        timelabel = true;
                    }
                    return (
                        <div 
                            key={`${day}-${query.start_time}`}
                            className="event search"
                            style={{
                                gridRowStart: rowStart,
                                gridRowEnd: rowEnd,
                            }}
                        >
                            {timelabel ? <p className="time">{minutesToTime(query.start_time)} - {minutesToTime(query.end_time)}</p>: ""}
                            <button 
                                className="remove-event"
                                onClick={() => remove(day, query)}
                            >remove</button>
                        </div>
                    );
                })
                : ""
            }
        </div>

    );
}

export default DayColumn;
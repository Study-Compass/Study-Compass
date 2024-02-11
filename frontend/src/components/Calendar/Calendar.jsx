import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';

function Calendar({className, data, isLoading}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [empty, setEmpty] = useState(true);

    const [query, setQuery] = useState({
        'M': [],
        'T': [],
        'W': [],
        'R': [],
        'F': [],
    });
    const [noquery, setNoQuery] = useState(true);

    const addQuery = (key, newValue) => {
        setNoQuery(false);
        setQuery(prev => {
    
            const convertTime = (time) => {
                const [hour, minute] = time.split(':');
                return parseInt(hour) + (minute === '30' ? 0.5 : 0);
            };
    
            const stringifyTime = (time) => {
                const hours = Math.floor(time);
                const minutes = (time % 1) * 60;
                return `${hours}:${minutes.toString().padStart(2, '0')}`;
            };
    
            // Create a list that includes all existing timeslots plus the new one.
            const allSlots = [...prev[key], newValue];
    
            // Convert timeslots to a comparable format (minutes since midnight).
            const slotsWithMinutes = allSlots.map(slot => ({
                ...slot,
                start: convertTime(slot.start_time),
                end: convertTime(slot.end_time)
            }));
    
            // Sort timeslots by start time.
            slotsWithMinutes.sort((a, b) => a.start - b.start);
    
            // Merge overlapping or consecutive timeslots.
            const mergedSlots = slotsWithMinutes.reduce((acc, slot) => {
                if (acc.length === 0) {
                    acc.push(slot);
                } else {
                    let lastSlot = acc[acc.length - 1];
                    if (lastSlot.end >= slot.start) {
                        // If the current slot overlaps or is consecutive with the last slot in acc, merge them.
                        lastSlot.end = Math.max(lastSlot.end, slot.end);
                        lastSlot.end_time = stringifyTime(lastSlot.end);
                    } else {
                        // If not overlapping or consecutive, just add the slot to acc.
                        acc.push(slot);
                    }
                }
                return acc;
            }, []);
    
            // Map back to the original format.
            const finalSlots = mergedSlots.map(slot => ({
                class_name: slot.class_name, // This might need adjustment based on your requirements.
                start_time: stringifyTime(slot.start),
                end_time: stringifyTime(slot.end)
            }));
    
            // Return updated state.
            return { ...prev, [key]: finalSlots };
        });
    };    

    useEffect(() => {
        console.log("query: ", query);
    }, [query]);

    const removeQuery = (key, value) => {
        setQuery(prev => {
            const existing = prev[key];
            if (existing === undefined) {
                return prev;
            } else {
                const filtered = existing.filter(v => v !== value);
                if (filtered.length === 0) {
                    const { [key]: omit, ...rest } = prev;
                    return rest;
                } else {
                    return { ...prev, [key]: filtered };
                }
            }
        });
        Object.keys(query).every(key => query[key].length === 0) ? setNoQuery(true) : setNoQuery(false);
    }

    useEffect(() => {
        if(className === "none"){
            setEmpty(true);
        } else {
            setEmpty(false);
        }
    }, [empty, className]);

    const load = [                
        {
            "class_name": "loading",
            "start_time": "7:00",
            "end_time": "21:00"
        },
    ];

    return (
            <div className="Calendar">
                {/* <h1>{className.toLowerCase()}</h1> */}
                <div className="Calendar-header">
                    <p>monday</p>
                    <p>tuesday</p>
                    <p>wednesday</p>
                    <p>thursday</p>
                    <p>friday</p>
                </div>
                <div className="Time-grid">
                    {days.map((day) => (
                        <DayColumn 
                            key={day}
                            day={day} 
                            dayEvents={isLoading ? load : data ? data["weekly_schedule"][day]: load} 
                            eventColors={isLoading ? loadColors : data ? eventColors : loadColors }
                            empty = {empty} 
                            add = {addQuery}
                            remove = {removeQuery}
                            queries = {query}
                            // change={change}
                        />
                    ))}
                </div>
                <button className={`button ${noquery ? "" : "active"}`} style={{"width":"200px"}}>search</button>
            </div>
    );

}

export default Calendar
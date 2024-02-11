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

    const addQuery = (key, value) => {
        setQuery(prev => {
            const existing = prev[key];
            if (existing === undefined) {
                return { ...prev, [key]: [value] };
            } else {
                return { ...prev, [key]: [...existing, value] };
            }
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
            </div>
    );

}

export default Calendar
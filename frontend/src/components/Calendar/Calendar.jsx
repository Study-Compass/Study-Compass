import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';
import axios from 'axios';
function Calendar({className, data, isLoading, addQuery, removeQuery, query}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [empty, setEmpty] = useState(true);

    useEffect(() => {
        if(className === "none"){
            setEmpty(true);
        } else {
            setEmpty(false);
        }
    }, [empty, className]);

    const load = [                
        // {
        //     "class_name": "loading",
        //     "start_time": 420,
        //     "end_time": 1260
        // },
    ];

    return (
            <div className={`Calendar ${data ? "":"loading"}`}>
                {/* <h1>{className.toLowerCase()}</h1> */}
                {isLoading ? <div>loading</div>: ""}
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
                {/* <button 
                    className={`button ${noquery ? "" : "active"}`} 
                    style={{"width":"200px","height":"40px", "margin":"0 0 10px 0"}}
                    onClick={fetchFreeRooms1}
                >search</button> */}
            </div>
    );

}

export default Calendar
import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';

function Calendar({className, data, isLoading, addQuery, removeQuery, query}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [empty, setEmpty] = useState(true);


    useEffect(() => {
        eventColors.clear();
    },[data]);

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

    const today = new Date();
    const currentDay = today.getDay();

    useEffect(() => {console.log(data)},[data]);

    return (
            <div className={`Calendar ${data ? "":"loading"}`}>
                {/* <h1>{className.toLowerCase()}</h1> */}
                {isLoading ? <div>loading</div>: ""}
                <div className="Calendar-header">
                    <p className={`${currentDay === 1 ? "currentDay" : ""}`}>monday</p>
                    <p className={`${currentDay === 2 ? "currentDay" : ""}`}>tuesday</p>
                    <p className={`${currentDay === 3 ? "currentDay" : ""}`}>wednesday</p>
                    <p className={`${currentDay === 4 ? "currentDay" : ""}`}>thursday</p>
                    <p className={`${currentDay === 5 ? "currentDay" : ""}`}>friday</p>
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
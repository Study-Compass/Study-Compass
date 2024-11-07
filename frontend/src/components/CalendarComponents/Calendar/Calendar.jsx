import React, { useEffect, useState, useRef } from 'react';
import './Calendar.scss';
import DayColumn from '../DayColumn/DayColumn';
/** 
 * documentation:
 * https://incongruous-reply-44a.notion.site/Frontend-Calendar-DayColumn-Components-0283818fd23a4bbfa5ab81d76a0ad876
 * */ 

function Calendar({className, data, isLoading, addQuery, removeQuery, query, weekend=false, dateRange = null}){
    const days = weekend ?  ["S", "M", "T", "W", "R", "F", "H"] : ["G", "M", "T", "W", "R", "F"];
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
    ];

    const today = new Date();
    const currentDay = today.getDay();

    return (
            <div className={`Calendar ${data ? "":"loading"}`}>
                {isLoading ? <div>loading</div>: ""}
                <div className={`Calendar-header ${weekend && "weekend"} ${dateRange ? "date" : "   "}`}>
                    {weekend ? <p className={`${currentDay === 0 ? "currentDay" : ""}`}>sunday</p> : ""}
                    <p className={`${currentDay === 1 ? "currentDay" : ""}`}>monday</p>
                    <p className={`${currentDay === 2 ? "currentDay" : ""}`}>tuesday</p>
                    <p className={`${currentDay === 3 ? "currentDay" : ""}`}>wednesday</p>
                    <p className={`${currentDay === 4 ? "currentDay" : ""}`}>thursday</p>
                    <p className={`${currentDay === 5 ? "currentDay" : ""}`}>friday</p>
                    {weekend ? <p className={`${currentDay === 6 ? "currentDay" : ""}`}>saturday</p> : ""}
                </div>
                {
                    dateRange ?
                    <div className={`Calendar-header ${weekend && "weekend"}`}>
                        <p>{dateRange[0]}</p>
                        <p>{dateRange[1]}</p>
                        <p>{dateRange[2]}</p>
                        <p>{dateRange[3]}</p>
                        <p>{dateRange[4]}</p>
                        <p>{dateRange[5]}</p>
                        <p>{dateRange[6]}</p>
                    </div>
                    : ""
                }
                <div className="Time-grid">
                    {days.map((day) => (
                        <DayColumn 
                            key={day}
                            day={day} 
                            dayEvents={isLoading ? load : data ? data["weekly_schedule"][day] ?data["weekly_schedule"][day] : load : load} 
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

export default Calendar;
import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';
import axios from 'axios';
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
                // Create a list that includes all existing timeslots plus the new one.
            const allSlots = [...prev[key], newValue];
    
            // Sort timeslots by start time.
            allSlots.sort((a, b) => a.start_time - b.start_time);
    
            // Merge overlapping or consecutive timeslots.
            const mergedSlots = allSlots.reduce((acc, slot) => {
                if (acc.length === 0) {
                    acc.push(slot);
                } else {
                    let lastSlot = acc[acc.length - 1];
                    if (lastSlot.end_time >= slot.start_time) {
                        // If the current slot overlaps or is consecutive with the last slot in acc, merge them.
                        lastSlot.end_time = Math.max(lastSlot.end_time, slot.end_time);
                    } else {
                        // If not overlapping or consecutive, just add the slot to acc.
                        acc.push(slot);
                    }
                }
                return acc;
            }, []);
    
            // Return updated state.
            return { ...prev, [key]: mergedSlots };
        });
    };    

    useEffect(() => {
        console.log("query: ", query);
        const allEmpty = Object.keys(query).every(key => query[key].length === 0);
        setNoQuery(allEmpty);
    }, [query]);

    const removeQuery = (key, value) => {
        setQuery(prev => {
            const existing = prev[key];
            if (existing === undefined) {
                // If the key does not exist, return the previous state unchanged.
                return prev;
            } else {
                // Filter the array to remove the specified value.
                const filtered = existing.filter(v => v !== value);
                // Always return the object with the key, even if the array is empty.
                return { ...prev, [key]: filtered };
            }
        });
        // Check if all keys in the query object have empty arrays and update `noQuery` accordingly.
        // Object.keys(query).every(key => query[key].length === 0) ? setNoQuery(true) : setNoQuery(false);
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
            "start_time": 420,
            "end_time": 1260
        },
    ];

    const fetchFreeRooms = async () => {
        try {
          const response = await axios.post('/free', {query});
          const roomNames = response.data;
          console.log(roomNames); // Process the response as needed
        } catch (error) {
          console.error('Error fetching free rooms:', error);
          // Handle error
        }
      };
    

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
                <button 
                    className={`button ${noquery ? "" : "active"}`} 
                    style={{"width":"200px","height":"40px", "margin":"0 0 10px 0"}}
                    onClick={fetchFreeRooms}
                >search</button>
            </div>
    );

}

export default Calendar
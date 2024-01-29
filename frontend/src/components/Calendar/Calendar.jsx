import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';
import { AuthContext } from '../../AuthContext';

function Calendar({className}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [data, setData] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [empty, setEmpty] = useState(true);
    const { isAuthenticated } = React.useContext(AuthContext);

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
            "end_time": "20:00"
        },
    ];

    useEffect(() => {
        if(isAuthenticated === null || !isAuthenticated){
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/getroom/${className}`);
                const data = await response.json();
                setData(data);
                console.log(data);
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally{
                setLoading(false);
            }
        };

        fetchData();
    }, [className, isAuthenticated]);


    const change = (action, event) => {
        if(!isLoading){
            if(action === "add"){
                let newdata = { ...data };  // Creates a shallow copy of the data object
                newdata["weekly_schedule"] = { ...newdata["weekly_schedule"] };  // Shallow copy of weekly_schedule
                if (!Array.isArray(newdata.weekly_schedule[event.day])) {
                    newdata.weekly_schedule[event.day] = [];
                }
                newdata["weekly_schedule"][event.day].push(event);  // Push the new event
                setData(newdata);
            }
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
                            change={change}
                        />
                    ))}
                </div>
            </div>
    );

}

export default Calendar
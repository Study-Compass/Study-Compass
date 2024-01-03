import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';

function Calendar({className}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [data, setData] = useState(null);
    const [isLoading, setLoading] = useState(false);


    const load = [                
        {
            "class_name": "loading",
            "start_time": "7:00",
            "end_time": "20:00"
        },
    ];

    useEffect(() => {
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
    }, [className]);


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
                        />
                    ))}
                </div>
            </div>
    );

}

export default Calendar
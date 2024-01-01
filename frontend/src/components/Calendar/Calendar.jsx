import React, { useEffect, useState, useRef } from 'react';
import './Calendar.css';
import DayColumn from '../DayColumn/DayColumn';

function Calendar({className}){
    const days = ["S", "M", "T", "W", "R", "F"];
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [data, setData] = useState(null);

    const load = [                
        {
            "class_name": "loading",
            "start_time": "7:00",
            "end_time": "20:00"
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/getroom/${className}`);
                const data = await response.json();
                setData(data);
            } catch (error) {
                console.error("Error fetching data: ", error);
            }
        };

        fetchData();
    }, [className]);

    // Render loading state while data is being fetched
    if (!data) {
        return (
            <div className="Calendar">
                <div className="Calendar-header">
                    <p>monday</p>
                    <p>tuesday</p>
                    <p>wednesday</p>
                    <p>thursday</p>
                    <p>friday</p>
                </div>
                <div className="Time-grid">
                    {days.map((day) => (
                        <DayColumn day={day} dayEvents={load} eventColors={loadColors} />
                    ))}
                </div>
            </div>
        );
    }

    return (
            <div className="Calendar">
                <div className="Calendar-header">
                    <p>monday</p>
                    <p>tuesday</p>
                    <p>wednesday</p>
                    <p>thursday</p>
                    <p>friday</p>
                </div>
                <div className="Time-grid">
                    {days.map((day) => (
                        <DayColumn day={day} dayEvents={data["weekly_schedule"][day]} eventColors={eventColors} />
                    ))}
                </div>
            </div>
    );

}

export default Calendar
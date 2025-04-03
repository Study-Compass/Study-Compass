import React, { useState, useEffect, useRef } from 'react';
import './WeeklyCalendar.scss';
import { DateTime } from "luxon";
import CalendarEvent from '../../CalendarEvent/CalendarEvent';

const WeeklyCalendar = ({ startOfWeek, events, height, dayClick }) => {
    const [days, setDays] = useState([]);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTE_HEIGHT = 1; // 1px per minute

    const [now, setNow] = useState(DateTime.now().setZone("America/New_York")); // Ensures EST/EDT
    const [currentMinutes, setCurrentMinutes] = useState(now.hour * 60 + now.minute);

    const [width, setWidth] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [currentDay, setCurrentDay] = useState(null);


    useEffect(() => {
        const generateWeek = () => {
            const daysArray = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(date.getDate() + i);
                daysArray.push(date);
            }
            setDays(daysArray);
        };

        generateWeek();
        setNow(DateTime.now().setZone("America/New_York"));
        setCurrentMinutes(now.hour * 60 + now.minute);
    }, [startOfWeek]);

    useEffect(() => {
        console.log("h")
        const today = new Date();
        const todayIndex = days.findIndex(day => day.toDateString() === today.toDateString());
        setCurrentDay(todayIndex);
        console.log(todayIndex);
    }, [days]);

    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            // scroll to current time
            //find earliest event by time not date
            const earliestEvent = events.reduce((earliest, event) => {
                const eventTime = new Date(event.start_time);
                const eventHours = eventTime.getHours();
                const eventMinutes = eventTime.getMinutes();

                const earliestTime = new Date(earliest);
                const earliestHours = earliestTime.getHours();
                const earliestMinutes = earliestTime.getMinutes();

                // Compare purely by hours and minutes
                return (eventHours < earliestHours || (eventHours === earliestHours && eventMinutes < earliestMinutes))
                    ? eventTime
                    : earliest;
            }, new Date(events[0]?.start_time || '1970-01-01T00:00:00Z')); // Default to the first event or midnight

            let earliestHour = earliestEvent.getHours();
            if (earliestHour === 16){
                earliestHour = 8;
            }

            if(currentDay !== -1){
                ref.current.scrollTo({
                    top: (currentMinutes * MINUTE_HEIGHT) - 20,
                    behavior: 'smooth'
                });
                console.log('got here', currentMinutes)
            } else {

                ref.current.scrollTo({
                    top: (earliestHour * 60 * MINUTE_HEIGHT) - 20,
                    behavior: 'smooth'
                });
                console.log('got here', earliestHour)
            }


            // Set width and bottom for fixed-bottom
            setWidth(ref.current.clientWidth);
            setBottom(ref.current.getBoundingClientRect().bottom);
        }

    }, [ref, events]);


    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };



    const processEvents = (dayEvents) => {
        // Sort events by start time
        const sorted = [...dayEvents].sort((a, b) =>
            new Date(a.start_time) - new Date(b.start_time)
        );

        const lanes = [];
        const eventGroups = [];

        // Assign events to lanes
        sorted.forEach(event => {
            const start = new Date(event.start_time);
            const end = new Date(event.end_time);

            let laneIndex = lanes.findIndex(laneEnd => start >= laneEnd);
            if (laneIndex === -1) laneIndex = lanes.length;

            lanes[laneIndex] = end;
            event.groups = { laneIndex, totalLanes: lanes.length };
            eventGroups.push(event);
        });

        return eventGroups;
    };

    const renderEvents = (day) => {
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.start_time).toDateString();
            return eventDate === day.toDateString();
        });

        const processedEvents = processEvents(dayEvents);

        return processedEvents.map((event, index) => {
            const start = new Date(event.start_time);
            const end = new Date(event.end_time);
            const top = (start.getHours() * 60 + start.getMinutes()) * MINUTE_HEIGHT;
            const height = ((end - start) / (1000 * 60)) * MINUTE_HEIGHT;
            const left = (event.groups.laneIndex / event.groups.totalLanes) * 100;
            const width = 100 / event.groups.totalLanes;

            return (
                <div
                    key={index}
                    className="event"
                    style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        width: `calc(${width}% - 4px)`
                    }}
                >
                    {/* <div className="event-name">{event.name}</div>
                    <div className="event-details">
                        <span className="event-type">{event.type}</span>
                        <span className="event-location">{event.location}</span>
                    </div>
                    <div className="event-time">
                        {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </div> */}
                    <CalendarEvent event={event}/>
                </div>
            );
        });
    };

    const renderTimeGrid = () => {
        const times = Array.from({ length: 48 }, (_, i) => i * 30); // 30-minute intervals

        return times.map((minutes, index) => {
            const isHour = minutes % 60 === 0;
            return (
                <div
                    key={index}
                    className={`time-grid-line ${isHour ? 'hour-line' : 'half-hour-line'}`}
                    style={{ top: `${minutes * MINUTE_HEIGHT}px` }}
                />
            );
        });
    };

    return (
        <div className="oie-weekly-calendar-container" style={{ height: `${height}` }} ref={ref}>
            {/* current time line */}
            <div className="calendar-header">
                <div className="time-header"></div>
                {days.map((day, index) => (
                    <div key={index} className={`day-header ${currentDay === index ? 'current-day' : ''}`}>
                        <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="day-date">{day.getDate()}</div>
                    </div>
                ))}
            </div>

            <div className="calendar-body">
                <div 
                    className="current-time-line" 
                    style={{ top: `${currentMinutes * MINUTE_HEIGHT}px` }} 
                />               
                <div className="time-column">
                    {hours.map(hour => (
                        <div key={hour} className="time-label" style={{ top: `${hour * 60 * MINUTE_HEIGHT}px` }}>
                            {new Date(0, 0, 0, hour).toLocaleTimeString([], { hour: '2-digit' })}
                        </div>
                    ))}
                </div>

                <div className="days-container">
                    {days.map((day, index) => (
                        <div key={index} className={`day-column ${currentDay === index ? 'current-day' : ''}`} onClick={()=>dayClick(day.toISOString())}>
                            {currentDay === index && <div className="current-day-time-line" style={{ top: `${currentMinutes * MINUTE_HEIGHT}px` }} />}
                            {renderTimeGrid()}
                            {renderEvents(day)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="fixed-bottom" style={{ width: `${width}px`, top: `${bottom - 10}px` }}>

            </div>
        </div>
    );
};

export default WeeklyCalendar;
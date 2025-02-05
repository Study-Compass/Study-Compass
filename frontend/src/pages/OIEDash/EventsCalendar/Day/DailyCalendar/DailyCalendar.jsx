import React, { useState, useEffect, useRef } from 'react';
import '../../Week/WeeklyCalendar/WeeklyCalendar.scss';
import { DateTime } from "luxon";

const DailyCalendar = ({ selectedDay, events, height }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTE_HEIGHT = 1; // 1px per minute

    const [now, setNow] = useState(DateTime.now().setZone("America/New_York"));
    const [currentMinutes, setCurrentMinutes] = useState(now.hour * 60 + now.minute);

    const ref = useRef(null);

    useEffect(() => {
        setNow(DateTime.now().setZone("America/New_York"));
        setCurrentMinutes(now.hour * 60 + now.minute);
    }, [selectedDay]);

    useEffect(() => {
        if (ref.current) {
            // Scroll to earliest event
            const earliestEvent = events.reduce((earliest, event) => {
                const eventTime = new Date(event.start_time);
                return eventTime < earliest ? eventTime : earliest;
            }, new Date(events[0]?.start_time || '1970-01-01T00:00:00Z'));

            let earliestHour = earliestEvent.getHours();
            if(earliestHour === 16){
                earliestHour = 8;
            }
            ref.current.scrollTo({
                top: (earliestHour * 60 * MINUTE_HEIGHT) - 20,
                behavior: 'smooth'
            });
        }
    }, [ref, events]);

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderEvents = () => {
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.start_time).toDateString();
            return eventDate === selectedDay.toDateString();
        });

        return dayEvents.map((event, index) => {
            const start = new Date(event.start_time);
            const end = new Date(event.end_time);
            const top = (start.getHours() * 60 + start.getMinutes()) * MINUTE_HEIGHT;
            const height = ((end - start) / (1000 * 60)) * MINUTE_HEIGHT;

            return (
                <div
                    key={index}
                    className="event"
                    style={{ top: `${top}px`, height: `${height}px` }}
                >
                    <div className="event-name">{event.name}</div>
                    <div className="event-time">{formatTime(event.start_time)} - {formatTime(event.end_time)}</div>
                </div>
            );
        });
    };

    const renderTimeGrid = () => {
        const times = Array.from({ length: 48 }, (_, i) => i * 30);

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
        <div className="oie-weekly-calendar-container" style={{ height: `${height}px` }} ref={ref}>
            <div className="calendar-header">
                <div className="day-header">
                    <div className="day-name">{selectedDay.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                    <div className="day-date">{selectedDay.getDate()}</div>
                </div>
            </div>

            <div className="calendar-body">
                <div className="current-time-line" style={{ top: `${currentMinutes * MINUTE_HEIGHT}px` }} />
                <div className="time-column">
                    {hours.map(hour => (
                        <div key={hour} className="time-label" style={{ top: `${hour * 60 * MINUTE_HEIGHT}px` }}>
                            {new Date(0, 0, 0, hour).toLocaleTimeString([], { hour: '2-digit' })}
                        </div>
                    ))}
                </div>

                <div className="day-column">
                    {renderTimeGrid()}
                    {renderEvents()}
                </div>
            </div>
        </div>
    );
};

export default DailyCalendar;

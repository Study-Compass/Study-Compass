import React, { useState, useEffect } from 'react';
import './WeeklyCalendar.scss';

const WeeklyCalendar = ({ startOfWeek, events }) => {
  const [days, setDays] = useState([]);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const MINUTE_HEIGHT = 1; // 1px per minute

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
  }, [startOfWeek]);

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
            width: `${width}%`
          }}
        >
          <div className="event-name">{event.name}</div>
          <div className="event-details">
            <span className="event-type">{event.type}</span>
            <span className="event-location">{event.location}</span>
          </div>
          <div className="event-time">
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="oie-weekly-calendar-container">
      <div className="calendar-header">
        <div className="time-header"></div>
        {days.map((day, index) => (
          <div key={index} className="day-header">
            <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="day-date">{day.getDate()}</div>
          </div>
        ))}
      </div>
      
      <div className="calendar-body">
        <div className="time-column">
          {hours.map(hour => (
            <div key={hour} className="time-label" style={{ top: `${hour * 60 * MINUTE_HEIGHT}px` }}>
              {new Date(0, 0, 0, hour).toLocaleTimeString([], { hour: '2-digit' })}
            </div>
          ))}
        </div>
        
        <div className="days-container">
          {days.map((day, index) => (
            <div key={index} className="day-column">
              {renderEvents(day)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
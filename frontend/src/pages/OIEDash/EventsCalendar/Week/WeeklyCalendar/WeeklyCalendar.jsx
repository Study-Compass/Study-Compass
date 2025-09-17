import React, { useState, useEffect, useRef, useCallback } from 'react';
import './WeeklyCalendar.scss';
import { DateTime } from "luxon";
import CalendarEvent from '../../CalendarEvent/CalendarEvent';
import { usePerformanceMonitor } from '../../../../../utils/performanceTest';

const WeeklyCalendar = ({ startOfWeek, events, height, dayClick, onTimeSelection, allowCrossDaySelection = true, timeIncrement = 15 }) => {
    const [days, setDays] = useState([]);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTE_HEIGHT = 1; // 1px per minute

    const [now, setNow] = useState(DateTime.now().setZone("America/New_York")); // Ensures EST/EDT
    const [currentMinutes, setCurrentMinutes] = useState(now.hour * 60 + now.minute);

    const [width, setWidth] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [currentDay, setCurrentDay] = useState(null);

    // Drag selection state
    const [dragSelectionMode, setDragSelectionMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);
    const [selectionArea, setSelectionArea] = useState(null);
    
    // Performance optimization refs
    const calendarBodyRef = useRef(null);
    const mouseMoveThrottleRef = useRef(null);
    
    // Performance monitoring
    const { recordMouseMove, recordRender } = usePerformanceMonitor();


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

    // Keyboard shortcut for toggling drag selection
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl/Cmd + S to toggle selection mode
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                toggleDragSelection();
            }
            // Escape to exit selection mode
            if (event.key === 'Escape' && dragSelectionMode) {
                setDragSelectionMode(false);
                setSelectionArea(null);
                setIsDragging(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dragSelectionMode]);

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
        // Generate grid lines based on time increment
        const totalMinutes = 24 * 60; // 1440 minutes in a day
        const incrementCount = Math.floor(totalMinutes / timeIncrement);
        const times = Array.from({ length: incrementCount }, (_, i) => i * timeIncrement);

        return times.map((minutes, index) => {
            const isHour = minutes % 60 === 0;
            const isIncrement = minutes % timeIncrement === 0;
            const isHalfHour = minutes % 30 === 0;
            
            let className = 'time-grid-line';
            if (isHour) {
                className += ' hour-line';
            } else if (isHalfHour && timeIncrement <= 30) {
                className += ' half-hour-line';
            } else if (isIncrement) {
                className += ' increment-line';
            }
            
            return (
                <div
                    key={index}
                    className={className}
                    style={{ top: `${minutes * MINUTE_HEIGHT}px` }}
                />
            );
        });
    };

    // Optimized drag selection handlers with 15-minute snapping
    const getTimeFromPosition = useCallback((clientY, dayIndex) => {
        const calendarBody = calendarBodyRef.current;
        if (!calendarBody) return null;

        const rect = calendarBody.getBoundingClientRect();
        const relativeY = clientY - rect.top;
        const rawMinutes = Math.max(0, Math.min(1440, Math.floor(relativeY / MINUTE_HEIGHT))); // 1440 = 24 * 60
        
        // Snap to configurable increments for better performance and UX
        const minutes = Math.round(rawMinutes / timeIncrement) * timeIncrement;
        
        return {
            dayIndex,
            minutes,
            time: days[dayIndex] // Use existing date object instead of creating new one
        };
    }, [days]);

    const handleMouseDown = (event) => {
        if (!dragSelectionMode) return;
        
        const dayColumn = event.target.closest('.day-column');
        if (!dayColumn) return;

        const dayIndex = parseInt(dayColumn.dataset.dayIndex);
        const timeData = getTimeFromPosition(event.clientY, dayIndex);
        
        if (timeData) {
            setIsDragging(true);
            setDragStart(timeData);
            setDragEnd(timeData);
            setSelectionArea({
                startDay: timeData.dayIndex,
                endDay: timeData.dayIndex,
                startMinutes: timeData.minutes,
                endMinutes: timeData.minutes,
                startTime: timeData.time,
                endTime: timeData.time
            });
        }
    };

    // Throttled mouse move handler for better performance
    const handleMouseMove = useCallback((event) => {
        if (!isDragging || !dragStart) return;

        // Record performance metrics
        recordMouseMove();

        // Throttle mouse move events to 16ms (60fps)
        if (mouseMoveThrottleRef.current) return;
        
        mouseMoveThrottleRef.current = requestAnimationFrame(() => {
            mouseMoveThrottleRef.current = null;
            
            const dayColumn = event.target.closest('.day-column');
            if (!dayColumn) {
                // If mouse moves outside day columns, use the last valid day
                const timeData = getTimeFromPosition(event.clientY, dragStart.dayIndex);
                if (timeData) {
                    setDragEnd(timeData);
                    setSelectionArea(prev => ({
                        ...prev,
                        endMinutes: timeData.minutes,
                        endTime: timeData.time
                    }));
                }
                return;
            }

            const dayIndex = parseInt(dayColumn.dataset.dayIndex);
            const timeData = getTimeFromPosition(event.clientY, dayIndex);
            
            if (timeData) {
                setDragEnd(timeData);
                
                // Update selection area - handle single column selection properly
                let startDay, endDay;
                
                if (allowCrossDaySelection) {
                    // Allow selection across multiple days
                    startDay = Math.min(dragStart.dayIndex, timeData.dayIndex);
                    endDay = Math.max(dragStart.dayIndex, timeData.dayIndex);
                } else {
                    // Restrict selection to the starting day only
                    startDay = dragStart.dayIndex;
                    endDay = dragStart.dayIndex;
                }
                
                // For time calculation, always use the actual start and end minutes from the drag
                const actualStartMinutes = Math.min(dragStart.minutes, timeData.minutes);
                const actualEndMinutes = Math.max(dragStart.minutes, timeData.minutes);

                setSelectionArea({
                    startDay,
                    endDay,
                    startMinutes: actualStartMinutes,
                    endMinutes: actualEndMinutes,
                    startTime: days[startDay], // Use existing date object
                    endTime: days[endDay] // Use existing date object
                });
            }
        });
    }, [isDragging, dragStart, getTimeFromPosition, allowCrossDaySelection, days]);

    const handleMouseUp = useCallback(() => {
        // Clean up throttle
        if (mouseMoveThrottleRef.current) {
            cancelAnimationFrame(mouseMoveThrottleRef.current);
            mouseMoveThrottleRef.current = null;
        }

        if (isDragging && selectionArea && onTimeSelection) {
            // Calculate the actual time range
            const startTime = new Date(selectionArea.startTime);
            startTime.setHours(Math.floor(selectionArea.startMinutes / 60));
            startTime.setMinutes(selectionArea.startMinutes % 60);
            startTime.setSeconds(0);

            const endTime = new Date(selectionArea.endTime);
            endTime.setHours(Math.floor(selectionArea.endMinutes / 60));
            endTime.setMinutes(selectionArea.endMinutes % 60);
            endTime.setSeconds(0);

            onTimeSelection({
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                startDay: selectionArea.startDay,
                endDay: selectionArea.endDay,
                duration: selectionArea.endMinutes - selectionArea.startMinutes
            });
        }

        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setSelectionArea(null);
    }, [isDragging, selectionArea, onTimeSelection]);

    const toggleDragSelection = () => {
        setDragSelectionMode(!dragSelectionMode);
        // Clear any existing selection when toggling off
        if (dragSelectionMode) {
            setSelectionArea(null);
            setIsDragging(false);
        }
    };

    // Memoized cursor style function
    const getCursorStyle = useCallback(() => {
        if (!dragSelectionMode) return 'default';
        if (allowCrossDaySelection) return 'crosshair';
        return 'ns-resize'; // Vertical resize cursor for single-day selection
    }, [dragSelectionMode, allowCrossDaySelection]);

    // Optimized selection area render with memoization
    const renderSelectionArea = useCallback(() => {
        if (!selectionArea || !isDragging) return null;

        // Record render performance
        recordRender();

        const startTop = selectionArea.startMinutes * MINUTE_HEIGHT;
        const endTop = selectionArea.endMinutes * MINUTE_HEIGHT;
        const selectionHeight = Math.max(2, Math.abs(endTop - startTop)); // Minimum 2px height

        return (
            <div 
                className="drag-selection-overlay"
                style={{
                    position: 'absolute',
                    left: `${(selectionArea.startDay / 7) * 100}%`,
                    width: `${((selectionArea.endDay - selectionArea.startDay + 1) / 7) * 100}%`,
                    top: `${Math.min(startTop, endTop)}px`,
                    height: `${selectionHeight}px`,
                    backgroundColor: 'rgba(74, 144, 226, 0.3)',
                    border: '2px solid #4a90e2',
                    pointerEvents: 'none',
                    zIndex: 10
                }}
            />
        );
    }, [selectionArea, isDragging, recordRender]);

    return (
        <div className="oie-weekly-calendar-container" style={{ height: `${height}` }} ref={ref}>
            {/* Drag selection toggle button */}
            <div className="drag-selection-controls" style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px', 
                zIndex: 20 
            }}>
                <button 
                    className={`drag-selection-toggle ${dragSelectionMode ? 'active' : ''}`}
                    onClick={toggleDragSelection}
                    title={
                        dragSelectionMode 
                            ? `Exit selection mode (Esc) - ${allowCrossDaySelection ? 'Multi-day' : 'Single-day'} selection` 
                            : `Enter selection mode (Ctrl+S) - ${allowCrossDaySelection ? 'Multi-day' : 'Single-day'} selection`
                    }
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: dragSelectionMode ? '#4a90e2' : '#fff',
                        color: dragSelectionMode ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    {dragSelectionMode ? 'Exit Selection' : 'Select Time'}
                    <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}>
                        ({dragSelectionMode ? 'Esc' : 'Ctrl+S'})
                    </span>
                    {!allowCrossDaySelection && (
                        <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}>
                            [Single-day]
                        </span>
                    )}
                    <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}>
                        [{timeIncrement}min]
                    </span>
                </button>
            </div>

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

            <div 
                className="calendar-body"
                ref={calendarBodyRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                    position: 'relative',
                    cursor: getCursorStyle()
                }}
            >
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

                <div className="days-container" style={{ position: 'relative' }}>
                    {days.map((day, index) => (
                        <div 
                            key={index} 
                            className={`day-column ${currentDay === index ? 'current-day' : ''} ${dragSelectionMode ? 'selection-mode' : ''}`} 
                            onClick={() => !dragSelectionMode && dayClick(day.toISOString())}
                            data-day-index={index}
                            style={{
                                cursor: dragSelectionMode ? getCursorStyle() : 'pointer'
                            }}
                        >
                            {currentDay === index && <div className="current-day-time-line" style={{ top: `${currentMinutes * MINUTE_HEIGHT}px` }} />}
                            {renderTimeGrid()}
                            {renderEvents(day)}
                        </div>
                    ))}
                    
                    {/* Selection area overlay - positioned relative to days container */}
                    {renderSelectionArea()}
                </div>
            </div>
            <div className="fixed-bottom" style={{ width: `${width}px`, top: `${bottom - 10}px` }}>

            </div>
        </div>
    );
};

export default WeeklyCalendar;
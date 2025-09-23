import React, { useState, useEffect, useRef, useCallback } from 'react';
import './WeeklyCalendar.scss';
import { DateTime } from "luxon";
import CalendarEvent from '../../CalendarEvent/CalendarEvent';
import { usePerformanceMonitor } from '../../../../../utils/performanceTest';

const WeeklyCalendar = ({ 
    startOfWeek, 
    events, 
    height, 
    dayClick, 
    onTimeSelection, 
    allowCrossDaySelection = false, 
    timeIncrement = 15, 
    singleSelectionOnly = false,
    autoEnableSelection = false,
    selectionMode = 'single'
}) => {
    const [days, setDays] = useState([]);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const MINUTE_HEIGHT = 1; // 1px per minute

    const [now, setNow] = useState(DateTime.now().setZone("America/New_York")); // Ensures EST/EDT
    const [currentMinutes, setCurrentMinutes] = useState(now.hour * 60 + now.minute);

    const [width, setWidth] = useState(0);
    const [bottom, setBottom] = useState(0);
    const [currentDay, setCurrentDay] = useState(null);

    // Enhanced selection state
    const [dragSelectionMode, setDragSelectionMode] = useState(autoEnableSelection);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragEnd, setDragEnd] = useState(null);
    const [selectionArea, setSelectionArea] = useState(null);
    const [selections, setSelections] = useState([]);
    
    // Enhanced interaction state
    const [interactionMode, setInteractionMode] = useState('none'); // 'none' | 'creating' | 'moving' | 'resizing'
    const [activeSelectionId, setActiveSelectionId] = useState(null);
    const [originalSelectionBounds, setOriginalSelectionBounds] = useState(null);
    const [resizeHandle, setResizeHandle] = useState(null); // 'top' | 'bottom'
    const [dragPreview, setDragPreview] = useState(null); // Preview of selection being dragged
    
    // Performance optimization refs
    const calendarBodyRef = useRef(null);
    const mouseMoveThrottleRef = useRef(null);
    const lockedDayIndexRef = useRef(null);
    
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
                setActiveSelectionId(null);
            }
            // Delete key to remove active selection
            if (event.key === 'Delete' && dragSelectionMode && activeSelectionId) {
                event.preventDefault();
                console.log('Delete key pressed for selection:', activeSelectionId);
                
                const selectionIdToDelete = activeSelectionId;
                setSelections(prev => {
                    const newSelections = prev.filter(s => s.id !== selectionIdToDelete);
                    console.log('Keyboard delete - new count:', newSelections.length);
                    return newSelections;
                });
                
                setActiveSelectionId(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dragSelectionMode, activeSelectionId]);

    const ref = useRef(null);

    // Track if initial scroll has been done
    const hasScrolledRef = useRef(false);

    useEffect(() => {
        if (ref.current && !hasScrolledRef.current) {
            // Only scroll on initial load, not on every update
            hasScrolledRef.current = true;
            
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
                console.log('Initial scroll to current time:', currentMinutes)
            } else {
                ref.current.scrollTo({
                    top: (earliestHour * 60 * MINUTE_HEIGHT) - 20,
                    behavior: 'smooth'
                });
                console.log('Initial scroll to earliest event:', earliestHour)
            }
        }

        if (ref.current) {
            // Set width and bottom for fixed-bottom (this can run on updates)
            setWidth(ref.current.clientWidth);
            setBottom(ref.current.getBoundingClientRect().bottom);
        }

    }, [ref, events, currentDay, currentMinutes]);


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

    // Helper function to find selection at a given position
    const findSelectionAtPosition = useCallback((dayIndex, minutes) => {
        return selections.find(selection => {
            return dayIndex >= selection.startDay && 
                   dayIndex <= selection.endDay &&
                   minutes >= selection.startMinutes && 
                   minutes <= selection.endMinutes;
        });
    }, [selections]);

    // Helper function to detect if click is on resize handle
    const detectResizeHandle = useCallback((selection, minutes) => {
        const handleSize = Math.max(8, timeIncrement); // 8 minutes or one increment, whichever is larger
        
        if (minutes <= selection.startMinutes + handleSize) {
            return 'top';
        } else if (minutes >= selection.endMinutes - handleSize) {
            return 'bottom';
        }
        return null;
    }, [timeIncrement]);

    // Helper function to check for overlaps and merge selections (including adjacent ones)
    const checkAndMergeSelections = useCallback((newSelection, currentSelections) => {
        const overlapping = currentSelections.filter(sel => 
            sel.id !== newSelection.id &&
            sel.startDay === newSelection.startDay &&
            sel.endDay === newSelection.endDay &&
            // Include overlapping AND adjacent selections (sharing borders)
            !(sel.endMinutes < newSelection.startMinutes || newSelection.endMinutes < sel.startMinutes)
        );

        if (overlapping.length === 0) {
            return { merged: newSelection, toRemove: [] };
        }

        // Calculate merged bounds
        const allSelections = [newSelection, ...overlapping];
        const mergedStartMinutes = Math.min(...allSelections.map(s => s.startMinutes));
        const mergedEndMinutes = Math.max(...allSelections.map(s => s.endMinutes));

        // Return merged selection and IDs to remove
        return {
            merged: {
                ...newSelection,
                startMinutes: mergedStartMinutes,
                endMinutes: mergedEndMinutes,
                id: `merged-${Date.now()}-${Math.random()}`
            },
            toRemove: overlapping.map(sel => sel.id)
        };
    }, []);

    const handleMouseDown = (event) => {
        if (!dragSelectionMode) return;
        

        
        const dayColumn = event.target.closest('.day-column');
        if (!dayColumn) return;

        const dayIndex = parseInt(dayColumn.dataset.dayIndex);
        const timeData = getTimeFromPosition(event.clientY, dayIndex);
        
        if (!timeData) return;

        // Check if clicking on an existing selection
        const existingSelection = findSelectionAtPosition(dayIndex, timeData.minutes);
        
        if (existingSelection) {
            // Clicking on existing selection - determine interaction mode
            const handle = detectResizeHandle(existingSelection, timeData.minutes);
            
            if (handle) {
                // Start resizing
                setInteractionMode('resizing');
                setResizeHandle(handle);
                setActiveSelectionId(existingSelection.id);
                setOriginalSelectionBounds({ ...existingSelection });
            } else {
                // Start moving
                setInteractionMode('moving');
                setActiveSelectionId(existingSelection.id);
                setOriginalSelectionBounds({ ...existingSelection });
            }
        } else {
            // Clicking on empty space - start creating new selection
            setInteractionMode('creating');
            lockedDayIndexRef.current = dayIndex;
            setSelectionArea({
                startDay: timeData.dayIndex,
                endDay: timeData.dayIndex,
                startMinutes: timeData.minutes,
                endMinutes: timeData.minutes,
                startTime: timeData.time,
                endTime: timeData.time
            });
        }

        setIsDragging(true);
        setDragStart(timeData);
        setDragEnd(timeData);
    };

    // Enhanced mouse move handler for different interaction modes
    const handleMouseMove = useCallback((event) => {
        if (!isDragging || !dragStart) return;

        // Record performance metrics
        recordMouseMove();

        // Throttle mouse move events to 16ms (60fps)
        if (mouseMoveThrottleRef.current) return;
        
        mouseMoveThrottleRef.current = requestAnimationFrame(() => {
            mouseMoveThrottleRef.current = null;
            
            const dayColumn = event.target.closest('.day-column');
            if (!dayColumn) return;

            let dayIndex = parseInt(dayColumn.dataset.dayIndex);
            const timeData = getTimeFromPosition(event.clientY, dayIndex);
            if (!timeData) return;

            setDragEnd(timeData);

            if (interactionMode === 'creating') {
                // Creating new selection
                if (!allowCrossDaySelection) {
                    dayIndex = lockedDayIndexRef.current ?? dragStart.dayIndex;
                }
                
                const startDay = allowCrossDaySelection ? Math.min(dragStart.dayIndex, dayIndex) : dayIndex;
                const endDay = allowCrossDaySelection ? Math.max(dragStart.dayIndex, dayIndex) : dayIndex;
                const actualStartMinutes = Math.min(dragStart.minutes, timeData.minutes);
                const actualEndMinutes = Math.max(dragStart.minutes, timeData.minutes);

                setSelectionArea({
                    startDay,
                    endDay,
                    startMinutes: actualStartMinutes,
                    endMinutes: actualEndMinutes,
                    startTime: days[startDay],
                    endTime: days[endDay]
                });

            } else if (interactionMode === 'moving' && activeSelectionId && originalSelectionBounds) {
                // Moving existing selection - create drag preview
                const deltaMinutes = timeData.minutes - dragStart.minutes;
                const newStartMinutes = Math.max(0, originalSelectionBounds.startMinutes + deltaMinutes);
                const newEndMinutes = Math.min(1440, originalSelectionBounds.endMinutes + deltaMinutes);
                
                // Ensure selection doesn't go beyond day boundaries
                const duration = originalSelectionBounds.endMinutes - originalSelectionBounds.startMinutes;
                const adjustedStartMinutes = Math.min(newStartMinutes, 1440 - duration);
                const adjustedEndMinutes = adjustedStartMinutes + duration;

                // Create drag preview instead of updating actual selection
                setDragPreview({
                    ...originalSelectionBounds,
                    startMinutes: adjustedStartMinutes,
                    endMinutes: adjustedEndMinutes,
                    isDragPreview: true
                });

            } else if (interactionMode === 'resizing' && activeSelectionId && originalSelectionBounds) {
                // Resizing existing selection - create drag preview
                const minDuration = timeIncrement; // Minimum duration
                
                if (resizeHandle === 'top') {
                    const newStartMinutes = Math.max(0, Math.min(timeData.minutes, originalSelectionBounds.endMinutes - minDuration));
                    setDragPreview({
                        ...originalSelectionBounds,
                        startMinutes: newStartMinutes,
                        isDragPreview: true
                    });
                } else if (resizeHandle === 'bottom') {
                    const newEndMinutes = Math.min(1440, Math.max(timeData.minutes, originalSelectionBounds.startMinutes + minDuration));
                    setDragPreview({
                        ...originalSelectionBounds,
                        endMinutes: newEndMinutes,
                        isDragPreview: true
                    });
                }
            }
        });
    }, [isDragging, dragStart, interactionMode, activeSelectionId, originalSelectionBounds, resizeHandle, allowCrossDaySelection, days, timeIncrement, getTimeFromPosition, recordMouseMove]);

    const handleMouseUp = useCallback(() => {
        // Clean up throttle
        if (mouseMoveThrottleRef.current) {
            cancelAnimationFrame(mouseMoveThrottleRef.current);
            mouseMoveThrottleRef.current = null;
        }

        if (!isDragging) return;

        if (interactionMode === 'creating' && selectionArea) {
            // Creating new selection
            let persistedArea = selectionArea;
            if (!allowCrossDaySelection) {
                const locked = lockedDayIndexRef.current ?? selectionArea.startDay;
                persistedArea = {
                    ...selectionArea,
                    startDay: locked,
                    endDay: locked,
                    startTime: days[locked],
                    endTime: days[locked]
                };
            }

            // Calculate the actual time range
            const startTime = new Date(persistedArea.startTime);
            startTime.setHours(Math.floor(selectionArea.startMinutes / 60));
            startTime.setMinutes(selectionArea.startMinutes % 60);
            startTime.setSeconds(0);

            const endTime = new Date(persistedArea.endTime);
            endTime.setHours(Math.floor(selectionArea.endMinutes / 60));
            endTime.setMinutes(selectionArea.endMinutes % 60);
            endTime.setSeconds(0);

            // Create new selection
            let newSelection = {
                startDay: persistedArea.startDay,
                endDay: persistedArea.endDay,
                startMinutes: selectionArea.startMinutes,
                endMinutes: selectionArea.endMinutes,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                id: `selection-${Date.now()}-${Math.random()}`
            };

            // Check for overlaps and merge if necessary
            setSelections(prev => {
                const { merged, toRemove } = checkAndMergeSelections(newSelection, prev);
                const filteredSelections = prev.filter(sel => !toRemove.includes(sel.id));
                
                if (singleSelectionOnly) {
                    return [merged];
                } else {
                    return [...filteredSelections, merged];
                }
            });

            // Call the callback
            if (onTimeSelection) {
                onTimeSelection({
                    startTime: newSelection.startTime,
                    endTime: newSelection.endTime,
                    startDay: newSelection.startDay,
                    endDay: newSelection.endDay,
                    duration: newSelection.endMinutes - newSelection.startMinutes
                });
            }

        } else if (interactionMode === 'moving' && activeSelectionId && dragPreview) {
            // Moving completed - apply the drag preview changes and check for merges
            setSelections(prev => {
                const updatedSelection = {
                    ...prev.find(sel => sel.id === activeSelectionId),
                    startMinutes: dragPreview.startMinutes,
                    endMinutes: dragPreview.endMinutes
                };
                
                const { merged, toRemove } = checkAndMergeSelections(updatedSelection, prev);
                const filteredSelections = prev.filter(sel => !toRemove.includes(sel.id) && sel.id !== activeSelectionId);
                return [...filteredSelections, merged];
            });

        } else if (interactionMode === 'resizing' && activeSelectionId && dragPreview) {
            // Resizing completed - apply the drag preview changes and check for merges
            setSelections(prev => {
                const updatedSelection = {
                    ...prev.find(sel => sel.id === activeSelectionId),
                    startMinutes: dragPreview.startMinutes,
                    endMinutes: dragPreview.endMinutes
                };
                
                const { merged, toRemove } = checkAndMergeSelections(updatedSelection, prev);
                const filteredSelections = prev.filter(sel => !toRemove.includes(sel.id) && sel.id !== activeSelectionId);
                return [...filteredSelections, merged];
            });
        }

        // Reset interaction state
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setSelectionArea(null);
        setInteractionMode('none');
        setActiveSelectionId(null);
        setOriginalSelectionBounds(null);
        setResizeHandle(null);
        setDragPreview(null);
        lockedDayIndexRef.current = null;
    }, [isDragging, interactionMode, selectionArea, activeSelectionId, dragPreview, allowCrossDaySelection, days, singleSelectionOnly, onTimeSelection, checkAndMergeSelections]);

    const toggleDragSelection = () => {
        setDragSelectionMode(!dragSelectionMode);
        // Clear any existing selection when toggling off
        if (dragSelectionMode) {
            setSelectionArea(null);
            setIsDragging(false);
        }
    };

    // Enhanced cursor style function
    const getCursorStyle = useCallback((dayIndex, minutes) => {
        if (!dragSelectionMode) return 'default';
        
        if (isDragging) {
            if (interactionMode === 'moving') return 'grabbing';
            if (interactionMode === 'resizing') return 'ns-resize';
            return 'crosshair';
        }

        // Check if hovering over existing selection
        if (dayIndex !== undefined && minutes !== undefined) {
            const existingSelection = findSelectionAtPosition(dayIndex, minutes);
            if (existingSelection) {
                const handle = detectResizeHandle(existingSelection, minutes);
                if (handle) return 'ns-resize';
                return 'grab';
            }
        }

        return allowCrossDaySelection ? 'crosshair' : 'ns-resize';
    }, [dragSelectionMode, isDragging, interactionMode, allowCrossDaySelection, findSelectionAtPosition, detectResizeHandle]);

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
                    left: `calc(${(selectionArea.startDay / 7) * 100}% + 2px)`,
                    width: `calc(${((selectionArea.endDay - selectionArea.startDay + 1) / 7) * 100}% - 4px)`,
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

    // Render drag preview for moving/resizing selections
    const renderDragPreview = useCallback(() => {
        if (!dragPreview || !isDragging) return null;

        const startTop = dragPreview.startMinutes * MINUTE_HEIGHT;
        const endTop = dragPreview.endMinutes * MINUTE_HEIGHT;
        const selectionHeight = Math.max(2, Math.abs(endTop - startTop));

        return (
            <div 
                className="drag-selection-overlay drag-preview"
                style={{
                    position: 'absolute',
                    left: `calc(${(dragPreview.startDay / 7) * 100}% + 2px)`,
                    width: `calc(${((dragPreview.endDay - dragPreview.startDay + 1) / 7) * 100}% - 4px)`,
                    top: `${Math.min(startTop, endTop)}px`,
                    height: `${selectionHeight}px`,
                    backgroundColor: 'rgba(74, 144, 226, 0.5)',
                    border: '2px dashed #4a90e2',
                    pointerEvents: 'none',
                    zIndex: 20,
                    opacity: 0.8
                }}
            />
        );
    }, [dragPreview, isDragging]);

    // Render enhanced persisted selections with interaction capabilities
    const renderPersistedSelections = useCallback(() => {
        if (!selections || selections.length === 0) return null;

        return selections.map((sel, idx) => {
            const startTop = sel.startMinutes * MINUTE_HEIGHT;
            const endTop = sel.endMinutes * MINUTE_HEIGHT;
            const selectionHeight = Math.max(2, Math.abs(endTop - startTop));
            const isActive = sel.id === activeSelectionId;
            const isBeingManipulated = isDragging && isActive;
            
            // Hide the original selection when it's being dragged (show preview instead)
            if (isBeingManipulated && (interactionMode === 'moving' || interactionMode === 'resizing') && dragPreview) {
                return null;
            }

            return (
                <div 
                    key={sel.id || idx}
                    className={`drag-selection-overlay persisted ${isActive ? 'active' : ''} ${isBeingManipulated ? 'manipulating' : ''}`}
                    style={{
                        position: 'absolute',
                        left: `calc(${(sel.startDay / 7) * 100}% + 2px)`,
                        width: `calc(${((sel.endDay - sel.startDay + 1) / 7) * 100}% - 4px)`,
                        top: `${Math.min(startTop, endTop)}px`,
                        height: `${selectionHeight}px`,
                        backgroundColor: isActive ? 'rgba(74, 144, 226, 0.4)' : 'rgba(74, 144, 226, 0.2)',
                        border: `2px solid ${isActive ? '#4a90e2' : 'rgba(74, 144, 226, 0.8)'}`,
                        pointerEvents: dragSelectionMode ? 'auto' : 'none',
                        zIndex: isActive ? 15 : 5,
                        cursor: dragSelectionMode ? 'grab' : 'default',
                        transition: isBeingManipulated ? 'none' : 'all 0.2s ease',
                        boxShadow: isActive ? '0 4px 12px rgba(74, 144, 226, 0.3)' : 'none'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (dragSelectionMode && !isDragging) {
                            setActiveSelectionId(sel.id);
                        }
                    }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if (!dragSelectionMode) return;
                        
                        // Set this selection as active and start interaction
                        setActiveSelectionId(sel.id);
                        setOriginalSelectionBounds({ ...sel });
                        
                        // Determine if this is a resize or move operation
                        const rect = e.currentTarget.getBoundingClientRect();
                        const relativeY = e.clientY - rect.top;
                        const handleSize = 8;
                        
                        if (relativeY <= handleSize) {
                            setInteractionMode('resizing');
                            setResizeHandle('top');
                        } else if (relativeY >= rect.height - handleSize) {
                            setInteractionMode('resizing');
                            setResizeHandle('bottom');
                        } else {
                            setInteractionMode('moving');
                        }
                        
                        setIsDragging(true);
                        setDragStart({
                            dayIndex: sel.startDay,
                            minutes: sel.startMinutes + (sel.endMinutes - sel.startMinutes) / 2, // Middle of selection
                            time: days[sel.startDay]
                        });
                    }}
                >
                    {/* Resize handles */}
                    {dragSelectionMode && !isDragging && (
                        <>
                            <div 
                                className="resize-handle resize-handle-top"
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    height: '8px',
                                    cursor: 'ns-resize',
                                    backgroundColor: 'transparent'
                                }}
                            />
                            <div 
                                className="resize-handle resize-handle-bottom"
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    right: '0',
                                    height: '8px',
                                    cursor: 'ns-resize',
                                    backgroundColor: 'transparent'
                                }}
                            />
                        </>
                    )}
                    
                    {/* Delete button - always visible when in selection mode */}
                    {dragSelectionMode && !isDragging && (
                        <button
                            type="button"
                            className="selection-delete-button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Add alert for debugging
                                alert(`Deleting selection: ${sel.id}`);
                                console.log('Delete button clicked for selection:', sel.id);
                                console.log('Current selections count:', selections.length);
                                
                                // Simple, direct deletion
                                const selectionIdToDelete = sel.id;
                                setSelections(prev => {
                                    const newSelections = prev.filter(s => s.id !== selectionIdToDelete);
                                    console.log('New selections count:', newSelections.length);
                                    console.log('Remaining selection IDs:', newSelections.map(s => s.id));
                                    return newSelections;
                                });
                                
                                // Clear active selection if it was the deleted one
                                if (activeSelectionId === selectionIdToDelete) {
                                    setActiveSelectionId(null);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: '2px solid white',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100,
                                opacity: 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#dc2626';
                                e.target.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#ef4444';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >
                            ×
                        </button>
                    )}
                </div>
            );
        });
    }, [selections, activeSelectionId, isDragging, dragSelectionMode, interactionMode, dragPreview]);

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
                                cursor: dragSelectionMode ? getCursorStyle(index, undefined) : 'pointer'
                            }}
                            onMouseMove={(e) => {
                                if (dragSelectionMode && !isDragging) {
                                    const timeData = getTimeFromPosition(e.clientY, index);
                                    if (timeData) {
                                        e.target.style.cursor = getCursorStyle(index, timeData.minutes);
                                    }
                                }
                            }}
                        >
                            {currentDay === index && <div className="current-day-time-line" style={{ top: `${currentMinutes * MINUTE_HEIGHT}px` }} />}
                            {renderTimeGrid()}
                            {renderEvents(day)}
                        </div>
                    ))}
                    
                    {/* Selection area overlay - positioned relative to days container */}
                    {renderPersistedSelections()}
                    {renderSelectionArea()}
                    {renderDragPreview()}
                </div>
            </div>
            <div className="fixed-bottom" style={{ width: `${width}px`, top: `${bottom - 10}px` }}>

            </div>
        </div>
    );
};

export default WeeklyCalendar;
import React, { useState, useEffect, useMemo } from 'react';
import '../CreateComponents.scss'
import './EventDateTimeSelection.scss'

import { useCache } from '../../../CacheContext';
import { addQueryHelper, removeQueryHelper, getCurrentWeek, getNextWeek, getPreviousWeek, getDateTime } from './EventDateTimeSelectionHelper';
import { useNotification } from '../../../NotificationContext';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Month from '../../../pages/OIEDash/EventsCalendar/Month/Month';
import Week from '../../../pages/OIEDash/EventsCalendar/Week/Week';
import Day from '../../../pages/OIEDash/EventsCalendar/Day/Day';
import SelectedRoomsPreview from '../../SelectedRoomsPreview/SelectedRoomsPreview';
import {useFetch} from '../../../hooks/useFetch';
import EventCalenderWrapper from '../../EventCalenderWrapper/EventCalenderWrapper';

function EventDateTimeSelection({ formData, setFormData, onComplete }){
    const [selectedTimeOption, setSelectedTimeOption] = useState(formData.timeOption || null);
    const [selectedRoom, setSelectedRoom] = useState(formData.selectedRoom || null);
    const [selectedDate, setSelectedDate] = useState(formData.selectedDate || null);
    const [startTime, setStartTime] = useState(formData.start_time || null);
    const [endTime, setEndTime] = useState(formData.end_time || null);
    const [location, setLocation] = useState(formData.location || "");
    const [view, setView] = useState(0); // 0: month, 1: week, 2: day
    const { addNotification } = useNotification();

    // temp things
    const TEMPDATE = new Date();

    const options = useMemo(()=>({
        data: {queries: ['65dd0786d6b91fde155c0097', '65dd0786d6b91fde155c0099', '65dd0786d6b91fde155c009b'], exhaustive: true},    
        method: "POST"
    }), []);

    const { data, loading, error } = useFetch('/getbatch', options);

    // Update local state when formData changes
    useEffect(() => {
        if (formData.timeOption !== selectedTimeOption) setSelectedTimeOption(formData.timeOption || null);
        if (formData.selectedRoom !== selectedRoom) setSelectedRoom(formData.selectedRoom || null);
        if (formData.selectedDate !== selectedDate) setSelectedDate(formData.selectedDate || null);
        if (formData.start_time !== startTime) setStartTime(formData.start_time || null);
        if (formData.end_time !== endTime) setEndTime(formData.end_time || null);
        if (formData.location !== location) setLocation(formData.location || "");
    }, [formData]);

    useEffect(() => {
        const isValid = selectedRoom && selectedDate && startTime && endTime && location;
        onComplete(isValid);
        
        setFormData(prev => ({
            ...prev,
            timeOption: selectedTimeOption,
            selectedRoom,
            selectedDate,
            start_time: startTime,
            end_time: endTime,
            location
        }));
    }, [selectedTimeOption, selectedRoom, selectedDate, startTime, endTime, location, onComplete, setFormData]);

    const handleRoomSelection = (index) => {
        if (data && data.data) {
            const room = data.data[index];
            setSelectedRoom(room);
            setLocation(room.room?.name || "");
            console.log("Selected Room:", room);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setView(2); // Switch to day view when a date is selected
    };

    const handleTimeSelect = (start, end) => {
        setStartTime(start);
        setEndTime(end);
        setSelectedTimeOption({ start, end });
    };

    if (loading) return <div>Loading rooms...</div>;
    if (error) return <div>Error loading rooms: {error.message}</div>;

    return (
        <div className="event-date-time-selection">
            <div className="main-content">
                <div className="time-options-sidebar">
                    <h2>Room Options</h2>
                    {data && data.data && data.data.map((option, index) => (
                        <SelectedRoomsPreview 
                            key={index}
                            room={option.room} 
                            selected={selectedRoom === option} 
                            onSelect={() => handleRoomSelection(index)} 
                            optionIndex={index}
                        />
                    ))}
                </div>
                
                <div className="calendar-section">
                    <h3>Select Date and Time</h3>
                    {selectedRoom && (
                        <EventCalenderWrapper 
                            classSchedule={selectedRoom} 
                            start={TEMPDATE}
                            onTimeSelect={handleTimeSelect}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                        />
                    )}
                </div>
            </div>
            
            {selectedDate && startTime && endTime && (
                <div className="selection-summary">
                    <h4>Selected:</h4>
                    <p>Location: {location}</p>
                    <p>Date: {selectedDate.toLocaleDateString()}</p>
                    <p>Time: {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}</p>
                </div>
            )}
        </div>
    );
}

export default EventDateTimeSelection;


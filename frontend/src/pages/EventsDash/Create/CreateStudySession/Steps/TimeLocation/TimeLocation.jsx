import React, { useEffect, useState } from 'react';
import './TimeLocation.scss';

const TimeLocation = ({ formData, setFormData, onComplete }) => {
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');

    // Convert formData dates to form inputs on load
    useEffect(() => {
        if (formData.startTime) {
            const start = new Date(formData.startTime);
            setStartDate(start.toISOString().split('T')[0]);
            setStartTime(start.toTimeString().slice(0, 5));
        }
        if (formData.endTime) {
            const end = new Date(formData.endTime);
            setEndDate(end.toISOString().split('T')[0]);
            setEndTime(end.toTimeString().slice(0, 5));
        }
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const updateDateTime = () => {
        if (startDate && startTime) {
            const startDateTime = new Date(`${startDate}T${startTime}`);
            setFormData(prev => ({ ...prev, startTime: startDateTime.toISOString() }));
        }
        if (endDate && endTime) {
            const endDateTime = new Date(`${endDate}T${endTime}`);
            setFormData(prev => ({ ...prev, endTime: endDateTime.toISOString() }));
        }
    };

    useEffect(() => {
        updateDateTime();
    }, [startDate, startTime, endDate, endTime]);

    // Auto-fill end date when start date is selected
    useEffect(() => {
        if (startDate && !endDate) {
            setEndDate(startDate);
        }
    }, [startDate]);

    // Auto-fill end time (2 hours after start) when start time is selected
    useEffect(() => {
        if (startTime && !endTime) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const endHours = (hours + 2) % 24;
            const formattedEndTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            setEndTime(formattedEndTime);
        }
    }, [startTime]);

    // Validate step completion
    // Call onComplete once on mount - validation is handled by FlowComponentV2
    useEffect(() => {
        onComplete(true);
    }, []);

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Get minimum time for today
    const getMinTime = () => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        if (startDate === currentDate) {
            return now.toTimeString().slice(0, 5);
        }
        return '';
    };

    return (
        <div className="time-location-step">
            <div className="form-section">
                <h3>When & Where</h3>
                <p>Choose the date, time, and location for your study session.</p>

                <div className="datetime-section">
                    <h4>Date & Time</h4>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startDate">Start Date *</label>
                            <input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={getMinDate()}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="startTime">Start Time *</label>
                            <input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                min={getMinTime()}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="endDate">End Date *</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate || getMinDate()}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endTime">End Time *</label>
                            <input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime) && (
                        <div className="error-message">
                            End time must be after start time
                        </div>
                    )}

                    {formData.startTime && new Date(formData.startTime) <= new Date() && (
                        <div className="error-message">
                            Start time must be in the future
                        </div>
                    )}
                </div>

                <div className="location-section">
                    <h4>Location</h4>
                    
                    <div className="form-group">
                        <label htmlFor="location">Where will you meet? *</label>
                        <input
                            id="location"
                            type="text"
                            placeholder="e.g., Library Study Room A, Online, DCC 308"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            maxLength={200}
                        />
                        <div className="location-help">
                            You can specify a physical room, "Online" for virtual sessions, or "TBD" to decide later.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeLocation;

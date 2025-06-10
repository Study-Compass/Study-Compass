import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss'
import './EventDateTimeSelection.scss'

import { useCache } from '../../../CacheContext';
import { addQueryHelper, removeQueryHelper, getCurrentWeek, getNextWeek, getPreviousWeek, getDateTime } from './EventDateTimeSelectionHelper';
import { useNotification } from '../../../NotificationContext';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Month from '../../../pages/OIEDash/EventsCalendar/Month/Month';
import Week from '../../../pages/OIEDash/EventsCalendar/Week/Week';
import Day from '../../../pages/OIEDash/EventsCalendar/Day/Day';

function EventDateTimeSelection({next, visible, setInfo}){
    const [selectedTimeOption, setSelectedTimeOption] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState(0); // 0: month, 1: week, 2: day
    const { addNotification } = useNotification();

    const roomOptions = [
        {
            id: 'morning',
            title: 'Morning',
            description: '8:00 AM - 12:00 PM',
            times: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM'],
            icon: 'mdi:weather-sunny',
            available: true
        },
        {
            id: 'afternoon',
            title: 'Afternoon',
            description: '12:00 PM - 5:00 PM',
            times: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
            icon: 'mdi:weather-partly-cloudy',
            available: true
        },
        {
            id: 'evening',
            title: 'Evening',
            description: '5:00 PM - 9:00 PM',
            times: ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'],
            icon: 'mdi:weather-night',
            available: true
        }
    ];

    const handleTimeOptionSelect = (option) => {
        setSelectedTimeOption(option);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setView(2); // Switch to day view when a date is selected
    };

    const handleNext = () => {
        if (!selectedTimeOption || !selectedDate) {
            addNotification({
                title: "Selection Required",
                message: "Please select both a time option and a date",
                type: "error"
            });
            return;
        }

        setInfo(prev => ({
            ...prev,
            dateTime: {
                date: selectedDate,
                timeOption: selectedTimeOption
            }
        }));
        next();
    };

    if (!visible) return null;

    return (
        <div className="event-date-time-selection">
            <div className="time-options-sidebar">
                <h2>Room Options</h2>
                {/* {roomOptions.map((option) => (
                    
                ))} */}
            </div>
            <div className="calendar-container">
                {view === 0 && (
                    <Month 
                        height="calc(100% - 44px)"
                        changeToWeek={(date) => {
                            setSelectedDate(date);
                            setView(1);
                        }}
                        view={view}
                        setView={setView}
                        onDateSelect={handleDateSelect}
                        selectedDate={selectedDate}
                        timeOption={selectedTimeOption}
                    />
                )}
                {view === 1 && (
                    <Week 
                        height="calc(100% - 44px)"
                        start={selectedDate}
                        changeToDay={(date) => {
                            setSelectedDate(date);
                            setView(2);
                        }}
                        view={view}
                        setView={setView}
                        onDateSelect={handleDateSelect}
                        selectedDate={selectedDate}
                        timeOption={selectedTimeOption}
                    />
                )}
                {view === 2 && (
                    <Day 
                        height="calc(100% - 44px)"
                        start={selectedDate}
                        view={view}
                        setView={setView}
                        onDateSelect={handleDateSelect}
                        timeOption={selectedTimeOption}
                    />
                )}
            </div>
            <button 
                className="next-button" 
                onClick={handleNext}
                disabled={!selectedTimeOption || !selectedDate}
            >
                Next
                <Icon icon="mdi:arrow-right" />
            </button>
        </div>
    );
}

export default EventDateTimeSelection;


import React, { useState, useEffect, useMemo } from 'react';
import '../CreateComponents.scss'
import './EventDateTimeSelection.scss'

import { useCache } from '../../../CacheContext';
import { addQueryHelper, removeQueryHelper, getCurrentWeek, getNextWeek, getPreviousWeek, getDateTime } from './EventDateTimeSelectionHelper';
import { useNotification } from '../../../NotificationContext';
import { Icon } from '@iconify-icon/react/dist/iconify.js';
import Month from '../../../pages/OIEDash/EventsCalendar/Month/Month';
import Week from '../../../pages/OIEDash/EventsCalendar/Week/Week';
import Day from '../../../pages/OIEDash/EventsCalendar/Day/Day';
import SelectedRoomsPreview from '../../SelectedRoomsPreview/SelectedRoomsPreview';
import {useFetch} from '../../../hooks/useFetch';
import EventCalenderWrapper from '../../EventCalenderWrapper/EventCalenderWrapper';


const essentialEventFields = {
    name: "",
    type:"class",
    description: "",
    start_time: new Date(),
    end_time: new Date(),
    location: "",
    image: "",
}

function EventDateTimeSelection({next, visible, selectedRooms, setInfo}){
    const [selectedTimeOption, setSelectedTimeOption] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState(0); // 0: month, 1: week, 2: day
    const { addNotification } = useNotification();

    // temp things
    const TEMPDATE = new Date();


    const options = useMemo(()=>({
        data: {queries: ['65dd0786d6b91fde155c0097', '65dd0786d6b91fde155c0099', '65dd0786d6b91fde155c009b'], exhaustive: true},    
        method: "POST"
    }), []);

    const { data, loading, error } = useFetch('/getbatch', options);
    

    const handleRoomSelection = (index) => {
        setSelectedRoom(data.data[index]);
        console.log("Selected Room:", data.data[index]);
            
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
                {data.data.map((option, index) => (
                    <SelectedRoomsPreview room={option.room} selected={true} onSelect={handleRoomSelection} optionIndex={index}/>
                ))}
            </div>
            {/* <div className="calendar-container">
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
            </div> */}
            <EventCalenderWrapper classSchedule={selectedRoom} start={TEMPDATE}/>
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


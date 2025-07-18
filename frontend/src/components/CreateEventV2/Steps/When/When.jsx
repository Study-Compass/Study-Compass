import React, { useState, useEffect } from 'react';
import './When.scss'

import EventsCalendar from '../../../../pages/OIEDash/EventsCalendar/EventsCalendar';
import { useCache } from '../../../../CacheContext';
import { useNotification } from '../../../../NotificationContext';

function When({next, visible, setInfo}){
    const {addNotification} = useNotification();
    const {getRooms} = useCache();
    const [roomIds, setRoomIds] = useState({});
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [nextActive, setNextActive] = useState(false);

    const getRoomsData = async () => {
        try {
            const rooms = await getRooms();
            setRoomIds(rooms);
            setRooms(Object.keys(rooms).sort());
        } catch (error) {
            console.error('Error fetching rooms:', error);
            addNotification({ 
                title: "Error", 
                message: "Failed to load rooms", 
                type: "error" 
            });
        }
    }

    useEffect(() => {
        getRoomsData();
    }, []);

    useEffect(() => {
        if (selectedRoom) {
            setNextActive(true);
            setInfo(prev => ({
                ...prev,
                location: selectedRoom,
                classroomId: roomIds[selectedRoom]
            }));
        } else {
            setNextActive(false);
        }
    }, [selectedRoom, roomIds]);

    const handleRoomSelect = (roomName) => {
        setSelectedRoom(roomName);
    }

    return(
        <div className={`when-where create-component ${visible && "visible"}`}>
            <h1>when & where</h1>
            <div className="calendar-layout">
                <div className="room-sidebar">
                    <h3>Select Room</h3>
                    <div className="room-list">
                        {rooms.map((room) => (
                            <div 
                                key={room}
                                className={`room-option ${selectedRoom === room ? 'selected' : ''}`}
                                onClick={() => handleRoomSelect(room)}
                            >
                                <div className="room-box">
                                    <span className="room-name">{room}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="calendar-container">
                    <EventsCalendar expandedClass="create-event-calendar" />
                </div>
            </div>
            <button className={`next-button ${nextActive && "active"}`} onClick={next}>
                next
            </button>
        </div>
    );
}

export default When;


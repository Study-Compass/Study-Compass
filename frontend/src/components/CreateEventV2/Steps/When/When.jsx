import React, { useState, useEffect, useRef } from 'react';
import './When.scss'

import EventsCalendar from '../../../../pages/OIEDash/EventsCalendar/EventsCalendar';
import { useCache } from '../../../../CacheContext';
import { useNotification } from '../../../../NotificationContext';

function When({ formData, setFormData, onComplete }){
    const {addNotification} = useNotification();
    const {getRoom} = useCache();
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Use ref to prevent circular updates
    const isInternalUpdate = useRef(false);

    // Fetch data for the selected rooms from Where step
    const getSelectedRoomsData = async () => {
        try {
            setLoading(true);
            
            // If no rooms were selected in Where step, show error
            if (!formData.selectedRoomIds || formData.selectedRoomIds.length === 0) {
                addNotification({ 
                    title: "No Rooms Selected", 
                    message: "Please select rooms in the previous step", 
                    type: "error" 
                });
                setSelectedRooms([]);
                setLoading(false);
                return;
            }

            // Fetch detailed data for each selected room
            const roomPromises = formData.selectedRoomIds.map(async (roomId) => {
                const roomDetail = await getRoom(roomId);
                return {
                    id: roomId,
                    name: roomDetail?.room?.name || `Room ${roomId}`,
                    data: roomDetail?.data || {},
                    roomInfo: roomDetail?.room || {}
                };
            });

            const roomsWithData = await Promise.all(roomPromises);
            setSelectedRooms(roomsWithData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching selected rooms data:', error);
            addNotification({ 
                title: "Error", 
                message: "Failed to load selected rooms", 
                type: "error" 
            });
            setLoading(false);
        }
    }

    // Fetch rooms data when selectedRoomIds changes
    useEffect(() => {
        getSelectedRoomsData();
    }, [formData.selectedRoomIds]);

    // Initialize selectedRoom from existing formData (only once when rooms are loaded)
    useEffect(() => {
        if (!isInitialized && selectedRooms.length > 0 && formData.location && formData.classroomId) {
            const currentRoom = selectedRooms.find(room => 
                room.id === formData.classroomId || room.name === formData.location
            );
            if (currentRoom) {
                setSelectedRoom(currentRoom.name);
                console.log('When component validation: true (already completed)');
                onComplete(true);
            }
            setIsInitialized(true);
        } else if (!isInitialized && selectedRooms.length > 0) {
            setIsInitialized(true);
            onComplete(false);
        }
    }, [selectedRooms, formData.location, formData.classroomId, isInitialized, onComplete]);

    // Handle selectedRoom changes and update formData
    useEffect(() => {
        if (!isInitialized) return;
        
        if (selectedRoom) {
            const selectedRoomData = selectedRooms.find(room => room.name === selectedRoom);
            if (selectedRoomData) {
                isInternalUpdate.current = true;
                setFormData(prev => ({
                    ...prev,
                    location: selectedRoom,
                    classroomId: selectedRoomData.id
                }));
                console.log('When component validation: true (room selected)');
                onComplete(true);
                // Reset the flag after a brief delay
                setTimeout(() => {
                    isInternalUpdate.current = false;
                }, 0);
            }
        } else {
            console.log('When component validation: false (no room selected)');
            onComplete(false);
        }
    }, [selectedRoom, selectedRooms, isInitialized]);

    const handleRoomSelect = (roomName) => {
        setSelectedRoom(roomName);
    }

    if (loading) {
        return (
            <div className="when-where create-component">
                <div className="loading">
                    <p>Loading selected rooms...</p>
                </div>
            </div>
        );
    }

    if (selectedRooms.length === 0) {
        return (
            <div className="when-where create-component">
                <div className="no-rooms">
                    <p>No rooms available. Please go back and select rooms first.</p>
                </div>
            </div>
        );
    }

    return(
        <div className="when-where create-component">
            <div className="calendar-layout">
                <div className="room-sidebar">
                    <h3>Select Room</h3>
                    <div className="room-list">
                        {selectedRooms.map((room) => (
                            <div 
                                key={room.id}
                                className={`room-option ${selectedRoom === room.name ? 'selected' : ''}`}
                                onClick={() => handleRoomSelect(room.name)}
                            >
                                <div className="room-box">
                                    <span className="room-name">{room.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="calendar-container">
                    <EventsCalendar expandedClass="create-event-calendar" />
                </div>
            </div>
        </div>
    );
}

export default When;


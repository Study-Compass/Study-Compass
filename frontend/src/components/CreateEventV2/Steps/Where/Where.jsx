import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './Where.scss'

import { useCache } from '../../../../CacheContext';
import { useNotification } from '../../../../NotificationContext';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import FilledStar from '../../../../assets/Icons/FilledStar.svg';

function Where({ formData, setFormData, onComplete }){
    const { addNotification } = useNotification();
    const { getRooms, getRoom } = useCache();
    const [rooms, setRooms] = useState([]);
    const [roomData, setRoomData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoomIds, setSelectedRoomIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [showTagsFilter, setShowTagsFilter] = useState(false);
    const [showSortFilter, setShowSortFilter] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch all rooms and their data (only once)
    const fetchRoomsData = async () => {
        try {
            setLoading(true);
            
            // Get all room names and IDs
            const roomIds = await getRooms();
            if (!roomIds) {
                addNotification({ 
                    title: "Error", 
                    message: "Failed to fetch rooms", 
                    type: "error" 
                });
                return;
            }

            // Get room names sorted
            const roomNames = Object.keys(roomIds).sort();
            setRooms(roomNames);

            // Fetch detailed data for each room
            const roomPromises = roomNames.map(async (roomName) => {
                const roomId = roomIds[roomName];
                const roomDetail = await getRoom(roomId);
                return {
                    name: roomName,
                    id: roomId,
                    data: roomDetail?.data || {},
                    roomInfo: roomDetail?.room || {}
                };
            });

            const roomsWithData = await Promise.all(roomPromises);
            setRoomData(roomsWithData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching rooms data:', error);
            addNotification({ 
                title: "Error", 
                message: "Failed to fetch room data", 
                type: "error" 
            });
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomsData();
    }, []);

    // Initialize selected rooms from formData ONLY ONCE when component mounts
    useEffect(() => {
        if (!isInitialized && formData.selectedRoomIds && formData.selectedRoomIds.length > 0) {
            setSelectedRoomIds(new Set(formData.selectedRoomIds));
            setIsInitialized(true);
            console.log('Where component initialized with existing selection');
            onComplete(true);
        } else if (!isInitialized) {
            setIsInitialized(true);
            onComplete(false);
        }
    }, [formData.selectedRoomIds, isInitialized, onComplete]);

    // Get selected room objects from canonical roomData - maintain selection order
    const selectedRooms = useMemo(() => {
        if (roomData.length === 0 || selectedRoomIds.size === 0) {
            return [];
        }
        // Create a map for quick room lookup
        const roomMap = new Map(roomData.map(room => [room.id, room]));
        // Return rooms in the order they were selected (order of selectedRoomIds)
        return Array.from(selectedRoomIds)
            .map(id => roomMap.get(id))
            .filter(Boolean); // Filter out any undefined rooms
    }, [roomData, selectedRoomIds]);

    // Update form data when selection changes - but ONLY after initialization
    useEffect(() => {
        if (!isInitialized) return;

        const selectedRoomIdsArray = Array.from(selectedRoomIds);
        const hasSelectedRooms = selectedRoomIdsArray.length > 0;
        
        // Get the first selected room for backward compatibility
        const firstSelectedRoom = hasSelectedRooms ? 
            roomData.find(room => room.id === selectedRoomIdsArray[0]) : null;

        // Update form data
        setFormData(prev => ({
            ...prev,
            selectedRoomIds: selectedRoomIdsArray,
            location: firstSelectedRoom?.name || null,
            classroomId: firstSelectedRoom?.id || null
        }));

        console.log(`Where component validation: ${hasSelectedRooms ? 'true (rooms selected)' : 'false (no rooms selected)'}`);
        onComplete(hasSelectedRooms);
    }, [selectedRoomIds, roomData, setFormData, onComplete, isInitialized]);

    // Handle room selection/deselection
    const handleRoomToggle = useCallback((room) => {
        setSelectedRoomIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(room.id)) {
                newSet.delete(room.id);
            } else {
                newSet.add(room.id);
            }
            return newSet;
        });
    }, []);

    // Remove room from selection
    const handleRemoveRoom = useCallback((roomId) => {
        setSelectedRoomIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(roomId);
            return newSet;
        });
    }, []);

    // Filter rooms based on search query
    const filteredRooms = useMemo(() => {
        if (!roomData.length) return [];
        return roomData.filter(room => 
            room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (room.roomInfo.attributes && room.roomInfo.attributes.some(attr => 
                attr.toLowerCase().includes(searchQuery.toLowerCase())
            ))
        );
    }, [roomData, searchQuery]);

    // Get recommended rooms (first 3, excluding already selected ones)
    const recommendedRooms = useMemo(() => {
        if (!roomData.length) return [];
        
        return roomData
            .filter(room => !selectedRoomIds.has(room.id))
            .slice(0, 3);
    }, [roomData, selectedRoomIds]);

    // Fixed availability status - always high availability
    const getAvailabilityStatus = useCallback(() => {
        return { status: 'high availability', color: 'green' };
    }, []);

    // Extract room number from room name if it ends with a number
    const getRoomNumber = useCallback((roomName) => {
        const match = roomName.match(/(\d+)$/);
        return match ? match[1] : null;
    }, []);

    // Get room name without number
    const getRoomNameWithoutNumber = useCallback((roomName) => {
        return roomName.replace(/\s+\d+$/, '');
    }, []);

    if (loading) {
        return (
            <div className="where create-component">
                <div className="loading">
                    <p>Loading rooms...</p>
                </div>
            </div>
        );
    }

    return(
        <div className="where create-component">
            
            {/* Selected Section (shows when rooms are selected) */}
            {selectedRooms.length > 0 && (
                <div className="selected-section">
                    <h2>selected ({selectedRooms.length})</h2>
                    <div className={`selected-grid ${selectedRooms.length > 3 ? 'scrollable' : ''}`}>
                        {selectedRooms.map((room) => {
                            const availability = getAvailabilityStatus();
                            const roomNumber = getRoomNumber(room.name);
                            const roomNameWithoutNumber = getRoomNameWithoutNumber(room.name);
                            return (
                                <div 
                                    key={`selected-${room.id}`}
                                    className="room-card selected"
                                >
                                    <div className="room-image">
                                        {room.roomInfo.image ? (
                                            <img src={room.roomInfo.image} alt={room.name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )}
                                        <button 
                                            className="remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveRoom(room.id);
                                            }}
                                        >
                                            <Icon icon="material-symbols:close" />
                                        </button>
                                    </div>
                                    <div className="room-info">
                                        <div className="room-title">
                                            <h3>{roomNameWithoutNumber}</h3>
                                            {roomNumber && <span className="room-number">{roomNumber}</span>}
                                        </div>
                                        <div className="rating-availability">
                                            <div className="rating">
                                                <img src={FilledStar} alt="star" />
                                                <span>{room.roomInfo.average_rating ? room.roomInfo.average_rating.toFixed(1) : '4.7'}</span>
                                            </div>
                                            <div className="availability">
                                                <div className={`availability-dot ${availability.color}`}></div>
                                                <span>{availability.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recommended Section (shows when no rooms are selected) */}
            {selectedRooms.length === 0 && (
                <div className="recommended-section">
                    <h2>recommended</h2>
                    <div className="recommended-grid">
                        {recommendedRooms.map((room) => {
                            const availability = getAvailabilityStatus();
                            const roomNumber = getRoomNumber(room.name);
                            const roomNameWithoutNumber = getRoomNameWithoutNumber(room.name);
                            return (
                                <div 
                                    key={`recommended-${room.id}`}
                                    className="room-card recommended"
                                    onClick={() => handleRoomToggle(room)}
                                >
                                    <div className="room-image">
                                        {room.roomInfo.image ? (
                                            <img src={room.roomInfo.image} alt={room.name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )}
                                    </div>
                                    <div className="room-info">
                                        <div className="room-title">
                                            <h3>{roomNameWithoutNumber}</h3>
                                            {roomNumber && <span className="room-number">{roomNumber}</span>}
                                        </div>
                                        <div className="rating-availability">
                                            <div className="rating">
                                                <img src={FilledStar} alt="star" />
                                                <span>{room.roomInfo.average_rating ? room.roomInfo.average_rating.toFixed(1) : '4.7'}</span>
                                            </div>
                                            <div className="availability">
                                                <div className={`availability-dot ${availability.color}`}></div>
                                                <span>{availability.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search and Filter Bar */}
            <div className="search-filter-section">
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <Icon 
                            icon="material-symbols:close" 
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>
                <div className="filter-buttons">
                    <button 
                        className="filter-btn"
                        onClick={() => setShowTagsFilter(!showTagsFilter)}
                    >
                        <span>tags</span>
                        <Icon icon="material-symbols:keyboard-arrow-down" />
                    </button>
                    <button 
                        className="filter-btn"
                        onClick={() => setShowSortFilter(!showSortFilter)}
                    >
                        <Icon icon="material-symbols:sort" />
                        <span>sort</span>
                        <Icon icon="material-symbols:keyboard-arrow-down" />
                    </button>
                </div>
            </div>

            {/* Room List Section */}
            <div className="room-list-section">
                {filteredRooms.map((room) => {
                    const availability = getAvailabilityStatus();
                    const isSelected = selectedRoomIds.has(room.id);
                    const roomNumber = getRoomNumber(room.name);
                    const roomNameWithoutNumber = getRoomNameWithoutNumber(room.name);
                    return (
                        <div 
                            key={`list-${room.id}`}
                            className={`room-list-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleRoomToggle(room)}
                        >
                            <div className="room-thumbnail">
                                {room.roomInfo.image ? (
                                    <img src={room.roomInfo.image} alt={room.name} />
                                ) : (
                                    <div className="no-image">No Image</div>
                                )}
                            </div>
                            <div className="room-details">
                                <div className="room-title">
                                    <h3>{roomNameWithoutNumber}</h3>
                                    {roomNumber && <span className="room-number">{roomNumber}</span>}
                                </div>
                                <div className="rating-availability">
                                    <div className="rating">
                                        <img src={FilledStar} alt="star" />
                                        <span>{room.roomInfo.average_rating ? room.roomInfo.average_rating.toFixed(1) : '4.7'}</span>
                                    </div>
                                    <div className="availability">
                                        <div className={`availability-dot ${availability.color}`}></div>
                                        <span>{availability.status}</span>
                                    </div>
                                </div>
                                {room.roomInfo.attributes && room.roomInfo.attributes.length > 0 && (
                                    <div className="attributes">
                                        {room.roomInfo.attributes.slice(0, 5).map((attr, index) => (
                                            <span key={index} className="attribute">{attr}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="room-actions">
                                <button className={`add-btn ${isSelected ? 'selected' : ''}`}>
                                    {isSelected ? 'remove' : 'add'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Where;
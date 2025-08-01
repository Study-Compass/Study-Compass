import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './Where.scss'

import { useCache } from '../../../../CacheContext';
import { useNotification } from '../../../../NotificationContext';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import FilledStar from '../../../../assets/Icons/FilledStar.svg';
import Tags from '../../../../assets/Icons/sort/Tags.svg';
import SortBy from '../../../../assets/Icons/sort/SortBy.svg';
import TagsSelected from '../../../../assets/Icons/sort/TagsSelected.svg';
import SortBySelected from '../../../../assets/Icons/sort/SortBySelected.svg';
import ChevronDown from '../../../../assets/Icons/sort/ChevronDown.svg';
import ChevronUp from '../../../../assets/Icons/sort/ChevronUp.svg';
import { attributeIcons, selectedAttributeIcons } from '../../../../Icons';

function Where({ formData, setFormData, onComplete }){
    const { addNotification } = useNotification();
    const { getRooms, getRoom } = useCache();
    const [rooms, setRooms] = useState([]);
    const [roomData, setRoomData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoomIds, setSelectedRoomIds] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortBy, setSortBy] = useState('name');
    
    // Temporary state for pending changes (not applied until user clicks apply)
    const [tempSelectedTags, setTempSelectedTags] = useState([]);
    const [tempSortBy, setTempSortBy] = useState('name');
    
    // Ref for click outside detection
    const popupRef = useRef(null);

    // Available tags with their icons
    const availableTags = ["windows", "outlets", "printer", "small desks", "tables"];

    // Debug attributeIcons import
    useEffect(() => {
        console.log('attributeIcons imported as:', attributeIcons);
        console.log('selectedAttributeIcons imported as:', selectedAttributeIcons);
        console.log('attributeIcons keys:', attributeIcons ? Object.keys(attributeIcons) : 'undefined');
    }, []);

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
            console.log('Sample room data:', roomsWithData[0]); // Debug room data structure
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

    // Click outside detection to close popup and reset temporary state
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                // Reset temporary state to current applied state
                setTempSelectedTags(selectedTags);
                setTempSortBy(sortBy);
                setSelectedFilter(null);
            }
        };

        if (selectedFilter) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedFilter, selectedTags, sortBy]);

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

    // Handle filter selection
    const handleFilterSelect = (filter) => {
        if(selectedFilter === filter){
            setSelectedFilter(null);
        } else {
            // Initialize temporary state with current applied state when opening popup
            setTempSelectedTags(selectedTags);
            setTempSortBy(sortBy);
            setSelectedFilter(filter);
        }
    };

    // Handle temporary tag selection (not applied until user clicks apply)
    const handleTempTagSelect = (tag) => {
        setTempSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    // Handle temporary sort selection (not applied until user clicks apply)
    const handleTempSortSelect = (sortType) => {
        setTempSortBy(sortType);
    };

    // Apply filters - commit temporary state to actual state
    const applyFilters = () => {
        setSelectedTags(tempSelectedTags);
        setSortBy(tempSortBy);
        setSelectedFilter(null);
    };

    // Clear all filters
    const clearFilters = () => {
        setTempSelectedTags([]);
        setTempSortBy('name');
    };

    // Check if there are pending changes for apply button state
    const hasChanges = useMemo(() => {
        const tagsChanged = JSON.stringify(tempSelectedTags.sort()) !== JSON.stringify(selectedTags.sort());
        const sortChanged = tempSortBy !== sortBy;
        return tagsChanged || sortChanged;
    }, [tempSelectedTags, selectedTags, tempSortBy, sortBy]);

    // Enhanced search functionality based on SearchBar component
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        const query = searchQuery.toLowerCase().trim();
        
        // First get exact matches (startsWith)
        const exactMatches = roomData.filter(room => 
            room.name.toLowerCase().startsWith(query)
        );
        
        // Then get partial matches (contains but doesn't start with)
        const partialMatches = roomData.filter(room => {
            const name = room.name.toLowerCase();
            return name.includes(query) && !name.startsWith(query);
        });
        
        // Also search in attributes
        const attributeMatches = roomData.filter(room => {
            if (!room.roomInfo.attributes) return false;
            const nameMatch = room.name.toLowerCase().includes(query);
            if (nameMatch) return false; // Already included above
            
            return room.roomInfo.attributes.some(attr => 
                attr.toLowerCase().includes(query)
            );
        });
        
        // Combine and limit results
        const allMatches = [...exactMatches, ...partialMatches, ...attributeMatches];
        const uniqueMatches = allMatches.filter((room, index, self) => 
            index === self.findIndex(r => r.id === room.id)
        );
        
        return uniqueMatches.slice(0, 10);
    }, [roomData, searchQuery]);

    // Filter rooms based on search query and selected tags
    const filteredRooms = useMemo(() => {
        if (!roomData.length) return [];
        
        // If there's a search query, use search results as base
        let filtered = searchQuery.trim() ? searchResults : roomData;

        // Apply tag filters
        if (selectedTags.length > 0) {
            filtered = filtered.filter(room => 
                room.roomInfo.attributes && 
                selectedTags.some(tag => 
                    room.roomInfo.attributes.some(attr => 
                        attr.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'availability':
                    // For now, just sort by name since availability is fixed
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        // Cap at 10 items to reduce lag (only if not using search)
        return searchQuery.trim() ? filtered : filtered.slice(0, 10);
    }, [roomData, searchQuery, searchResults, selectedTags, sortBy]);

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
                            
                            console.log('Selected room attributes check:', {
                                roomName: room.name,
                                attributes: room.roomInfo.attributes,
                                attributesType: typeof room.roomInfo.attributes,
                                attributesLength: room.roomInfo.attributes?.length
                            });
                            
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
                                        {/* ALWAYS show room attributes - SIMPLIFIED AND DEFENSIVE */}
                                        {room.roomInfo.attributes && Array.isArray(room.roomInfo.attributes) && room.roomInfo.attributes.length > 0 ? (
                                            <div className="attributes">
                                                {room.roomInfo.attributes.slice(0, 4).map((attr, index) => {
                                                    console.log(`Processing selected room attribute: "${attr}"`);
                                                    
                                                    // Safely check for icons - don't let icon failures prevent attribute display
                                                    let iconSrc = null;
                                                    try {
                                                        if (attributeIcons && typeof attributeIcons === 'object') {
                                                            const attrLower = attr.toLowerCase().trim();
                                                            const iconKey = Object.keys(attributeIcons).find(key => 
                                                                attrLower.includes(key.toLowerCase()) || 
                                                                key.toLowerCase().includes(attrLower)
                                                            );
                                                            if (iconKey && attributeIcons[iconKey]) {
                                                                iconSrc = attributeIcons[iconKey];
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.error('Error processing icon for attribute:', attr, e);
                                                    }
                                                    
                                                    return (
                                                        <span key={`selected-attr-${index}`} className="attribute">
                                                            {iconSrc && (
                                                                <img 
                                                                    src={iconSrc} 
                                                                    alt={attr}
                                                                    className="attribute-icon"
                                                                    onError={(e) => {
                                                                        console.error(`Failed to load icon for ${attr}`);
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                            {attr}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="attributes">
                                                <span className="attribute">No attributes available</span>
                                            </div>
                                        )}
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
                            
                            console.log('Recommended room attributes check:', {
                                roomName: room.name,
                                attributes: room.roomInfo.attributes,
                                attributesType: typeof room.roomInfo.attributes,
                                attributesLength: room.roomInfo.attributes?.length
                            });
                            
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
                                        {/* ALWAYS show room attributes - SIMPLIFIED AND DEFENSIVE */}
                                        {room.roomInfo.attributes && Array.isArray(room.roomInfo.attributes) && room.roomInfo.attributes.length > 0 ? (
                                            <div className="attributes">
                                                {room.roomInfo.attributes.slice(0, 4).map((attr, index) => {
                                                    console.log(`Processing recommended room attribute: "${attr}"`);
                                                    
                                                    // Safely check for icons - don't let icon failures prevent attribute display
                                                    let iconSrc = null;
                                                    try {
                                                        if (attributeIcons && typeof attributeIcons === 'object') {
                                                            const attrLower = attr.toLowerCase().trim();
                                                            const iconKey = Object.keys(attributeIcons).find(key => 
                                                                attrLower.includes(key.toLowerCase()) || 
                                                                key.toLowerCase().includes(attrLower)
                                                            );
                                                            if (iconKey && attributeIcons[iconKey]) {
                                                                iconSrc = attributeIcons[iconKey];
                                                            }
                                                        }
                                                    } catch (e) {
                                                        console.error('Error processing icon for attribute:', attr, e);
                                                    }
                                                    
                                                    return (
                                                        <span key={`recommended-attr-${index}`} className="attribute">
                                                            {iconSrc && (
                                                                <img 
                                                                    src={iconSrc} 
                                                                    alt={attr}
                                                                    className="attribute-icon"
                                                                    onError={(e) => {
                                                                        console.error(`Failed to load icon for ${attr}`);
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                            {attr}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="attributes">
                                                <span className="attribute">No attributes available</span>
                                            </div>
                                        )}
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
                        placeholder="search rooms..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        spellCheck="false"
                    />
                    {searchQuery && (
                        <Icon 
                            icon="material-symbols:close" 
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                        />
                    )}
                </div>
                
                {/* Sort Row - using Sort component styling */}
                <div className="sort-row">
                    {selectedFilter === "tags" && (
                        <div className="sort-popup" ref={popupRef}>
                            <div className="heading">
                                <h1>Tags</h1>
                                <p onClick={clearFilters} className="clear">clear</p>
                            </div>
                            <div className="tags-container">
                                <div className="tags-content">
                                    <div className="include">
                                        {availableTags.map((tag, index) => (
                                            <div 
                                                key={index} 
                                                className={`option ${tempSelectedTags.includes(tag) ? "selected" : ""}`} 
                                                onClick={() => handleTempTagSelect(tag)}
                                            >
                                                {attributeIcons && Object.keys(attributeIcons).includes(tag) && (
                                                    <img 
                                                        src={tempSelectedTags.includes(tag) ? selectedAttributeIcons?.[tag] : attributeIcons[tag]} 
                                                        alt={tag}
                                                    />
                                                )}
                                                <p>{tag}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button 
                                className={`button ${hasChanges ? 'active' : ''}`} 
                                onClick={applyFilters}
                                disabled={!hasChanges}
                            >
                                apply
                            </button>
                        </div>
                    )}
                    
                    {selectedFilter === "sort" && (
                        <div className="sort-popup" ref={popupRef}>
                            <div className="heading">
                                <h1>Sort by</h1>
                            </div>
                            <div className="sort-options">
                                <div 
                                    className={tempSortBy === "name" ? "option selected" : "option"} 
                                    onClick={() => handleTempSortSelect("name")}
                                >
                                    <Icon icon="material-symbols:sort-by-alpha" />
                                    <p>Name</p>
                                </div>
                                <div 
                                    className={tempSortBy === "availability" ? "option selected" : "option"} 
                                    onClick={() => handleTempSortSelect("availability")}
                                >
                                    <Icon icon="material-symbols:schedule" />
                                    <p>Availability</p>
                                </div>
                            </div>
                            <button 
                                className={`button ${hasChanges ? 'active' : ''}`} 
                                onClick={applyFilters}
                                disabled={!hasChanges}
                            >
                                apply
                            </button>
                        </div>
                    )}
                    
                    <div 
                        className={`tags ${selectedFilter === 'tags' ? "selected": ""} ${selectedTags.length > 0 ? "has-filters" : ""}`} 
                        onClick={() => handleFilterSelect('tags')}
                    >
                        <img src={selectedFilter === 'tags' ? TagsSelected : Tags} alt="" />
                        <p>Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</p>
                        <img src={selectedFilter === 'tags' ? ChevronUp : ChevronDown} alt="" />
                    </div>
                    <div 
                        className={`sort-by ${selectedFilter === 'sort' ? "selected" : ""} ${sortBy !== 'name' ? "has-filters" : ""}`} 
                        onClick={() => handleFilterSelect('sort')}
                    >
                        <img src={selectedFilter === 'sort' ? SortBySelected : SortBy} alt="" />
                        <p>Sort {sortBy !== 'name' && `(${sortBy})`}</p>
                        <img src={selectedFilter === 'sort' ? ChevronUp : ChevronDown} alt="" />
                    </div>
                </div>
            </div>

            {/* Room List Section */}
            <div className="room-list-section">
                {filteredRooms.length === 0 && searchQuery.trim() && (
                    <div className="no-results">
                        <p>No rooms found matching "{searchQuery}"</p>
                        <p className="suggestion">Try adjusting your search terms or clearing filters</p>
                    </div>
                )}
                {filteredRooms.map((room) => {
                    const availability = getAvailabilityStatus();
                    const isSelected = selectedRoomIds.has(room.id);
                    const roomNumber = getRoomNumber(room.name);
                    const roomNameWithoutNumber = getRoomNameWithoutNumber(room.name);
                    
                    console.log('List room attributes check:', {
                        roomName: room.name,
                        attributes: room.roomInfo.attributes,
                        attributesType: typeof room.roomInfo.attributes,
                        attributesLength: room.roomInfo.attributes?.length
                    });
                    
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
                                {/* ALWAYS show room attributes - SIMPLIFIED AND DEFENSIVE */}
                                {room.roomInfo.attributes && Array.isArray(room.roomInfo.attributes) && room.roomInfo.attributes.length > 0 ? (
                                    <div className="attributes">
                                        {room.roomInfo.attributes.map((attr, index) => {
                                            console.log(`Processing list room attribute: "${attr}"`);
                                            
                                            // Safely check for icons - don't let icon failures prevent attribute display
                                            let iconSrc = null;
                                            try {
                                                if (attributeIcons && typeof attributeIcons === 'object') {
                                                    const attrLower = attr.toLowerCase().trim();
                                                    const iconKey = Object.keys(attributeIcons).find(key => 
                                                        attrLower.includes(key.toLowerCase()) || 
                                                        key.toLowerCase().includes(attrLower)
                                                    );
                                                    if (iconKey && attributeIcons[iconKey]) {
                                                        iconSrc = attributeIcons[iconKey];
                                                    }
                                                }
                                            } catch (e) {
                                                console.error('Error processing icon for attribute:', attr, e);
                                            }
                                            
                                            return (
                                                <span key={`list-attr-${index}`} className="attribute">
                                                    {iconSrc && (
                                                        <img 
                                                            src={iconSrc} 
                                                            alt={attr}
                                                            className="attribute-icon"
                                                            onError={(e) => {
                                                                console.error(`Failed to load icon for ${attr}`);
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                    {attr}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="attributes">
                                        <span className="attribute">No attributes available</span>
                                    </div>
                                )}
                            </div>
                            <div className="room-actions">
                                <div className={`add-btn ${isSelected ? 'selected' : ''}`}>
                                    {isSelected ? 'remove' : 'add'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Where;
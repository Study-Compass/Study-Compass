import './MyEvents.scss';
import EventsGrad from '../../../assets/Gradients/EventsGrad.png';
import useAuth from '../../../hooks/useAuth';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { getFriends } from '../../../pages/Friends/FriendsHelpers.js';
import Search from '../../../components/Search/Search';
import { useFetch } from '../../../hooks/useFetch';
import { useNotification } from '../../../NotificationContext';

import RecommendedEvents from './RecommendedEvents/RecommendedEvents';
import MyEventsContent from './MyEventsContent/MyEventsContent';

function MyEvents({ onRoomNavigation }){
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const [friends, setFriends] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searching, setSearching] = useState(false);

    // Fetch featured content for all users
    const { data: featuredResponse, loading: featuredLoading, error: featuredError } = useFetch('/featured-all');
    
    const featuredEvents = featuredResponse?.events || [];
    const featuredRooms = featuredResponse?.rooms || [];

    // Customize search types for MyEvents - focus on events and organizations
    const myEventsSearchTypes = [
        { key: 'events', label: 'Events', icon: 'mingcute:calendar-fill', enabled: true },
        // { key: 'organizations', label: 'Organizations', icon: 'mingcute:group-2-fill', enabled: true },
        { key: 'rooms', label: 'Rooms', icon: 'mingcute:building-fill', enabled: true },
        { key: 'users', label: 'Users', icon: 'mingcute:user-fill', enabled: isAuthenticated } // Only show users if authenticated
    ];

    // Custom navigation handlers
    const navigationHandlers = {
        rooms: onRoomNavigation || ((room) => navigate(`/room/${room._id}`)), // Use custom handler or fallback to default
        events: (event) => navigate(`/event/${event._id}`),
        organizations: (org) => navigate(`/org/${org.org_name}`),
        users: (user) => navigate(`/profile/${user.username}`)
    };

    useEffect(() => {
        const fetchFriends = async () => {
            if (isAuthenticated) {
                try {
                    const result = await getFriends();
                    setFriends(result);
                } catch (error) {
                    console.error('Error fetching friends:', error);
                }
            }
        };
        
        fetchFriends();
    }, [isAuthenticated]);

    const handleAddFriends = () => {
        navigate('/events-dashboard?page=2');
    };

    const handleSearchFocus = () => {
        setIsSearchFocused(true);
    };

    const handleSearchBlur = () => {
        setIsSearchFocused(false);
    };

    // Handle navigation to different sections
    const handleNavigateToEvents = () => {
        navigate('/events-dashboard?page=1'); // Navigate to Explore tab
    };

    const handleNavigateToRooms = () => {
        navigate('/events-dashboard?page=2'); // Navigate to Rooms tab
    };

    const handleNavigateToOrgs = () => {
        navigate('/events-dashboard?page=3'); // Navigate to Orgs tab
    };

    const handleNavigateToFriends = () => {
        if (isAuthenticated) {
            navigate('/events-dashboard?page=4'); // Navigate to Friends tab
        }
    };

    // Handle event press
    const handleEventPress = (event) => {
        console.log('Event pressed:', event);
        addNotification({
            title: 'Event Selected',
            message: `Opening ${event.title}`,
            type: 'info'
        });
    };

    // Handle room press
    const handleRoomPress = (room) => {
        navigate(`/events-dashboard?page=2&roomid=${encodeURIComponent(room.name)}`);
    };

    // Handle errors
    useEffect(() => {
        if (featuredError) {
            addNotification({
                title: 'Error',
                message: 'Failed to load featured content',
                type: 'error'
            });
        }
    }, [featuredError, addNotification]);

    return(
        <div className="my-events dash">
            <header className={`header ${isSearchFocused ? 'search-mode' : ''}`}>
                <img src={EventsGrad} alt="" />
                <h1>
                    {isAuthenticated 
                        ? `${welcomeText}, ${user?.username || 'User'}`
                        : 'Welcome to Meridian'
                    }
                </h1>
                <p>
                    {isAuthenticated 
                        ? 'Check out your upcoming events and see top picks for you'
                        : 'Discover campus events and find the perfect study spaces'
                    }
                </p>
            </header>
            
            {/* Search Bar */}
            <Search 
                variant="compact"
                onSearchFocus={handleSearchFocus}
                onSearchBlur={handleSearchBlur}
                isSearchFocused={isSearchFocused}
                placeholder="Search for events, rooms, or users..."
                className={`my-events-search ${isSearchFocused ? 'search-focused' : ''}`}
                searchTypes={myEventsSearchTypes}
                showAllTab={true}
                navigationHandlers={navigationHandlers}
                setSearching={setSearching}
            />

            {isAuthenticated && friends.length === 0 && (
                <div className="friends-notice">
                    <div className="notice-container">
                        <Icon icon="mingcute:user-add-fill" />
                        <span>You don't have any friends yet. Start connecting with people!</span>
                    </div>
                    <button onClick={handleAddFriends}>
                        Add Friends <Icon icon="heroicons:chevron-right" />
                    </button>
                </div>
            )}

            {/* Quick Actions Section */}
            {!isSearchFocused && (
                <div className="quick-actions-section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    <div 
                        className="quick-action-card"
                        onClick={handleNavigateToEvents}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNavigateToEvents();
                            }
                        }}
                    >
                        <div className="quick-action-icon" style={{ backgroundColor: '#6D8EFA20' }}>
                            <Icon icon="mingcute:calendar-fill" style={{ color: '#6D8EFA' }} />
                        </div>
                        <div className="quick-action-content">
                            <h3 className="quick-action-title">Events</h3>
                            <p className="quick-action-subtitle">Join study groups</p>
                        </div>
                    </div>

                    <div 
                        className="quick-action-card"
                        onClick={handleNavigateToRooms}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNavigateToRooms();
                            }
                        }}
                    >
                        <div className="quick-action-icon" style={{ backgroundColor: '#6EB25F20' }}>
                            <Icon icon="ic:baseline-room" style={{ color: '#6EB25F' }} />
                        </div>
                        <div className="quick-action-content">
                            <h3 className="quick-action-title">Study Rooms</h3>
                            <p className="quick-action-subtitle">Find quiet spaces</p>
                        </div>
                    </div>

                    {isAuthenticated && (
                        <>
                            <div 
                                className="quick-action-card"
                                onClick={handleNavigateToOrgs}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleNavigateToOrgs();
                                    }
                                }}
                            >
                                <div className="quick-action-icon" style={{ backgroundColor: '#FBEBBB20' }}>
                                    <Icon icon="mingcute:group-2-fill" style={{ color: '#FBEBBB' }} />
                                </div>
                                <div className="quick-action-content">
                                    <h3 className="quick-action-title">Organizations</h3>
                                    <p className="quick-action-subtitle">Join campus groups</p>
                                </div>
                            </div>

                            <div 
                                className="quick-action-card"
                                onClick={handleNavigateToFriends}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleNavigateToFriends();
                                    }
                                }}
                            >
                                <div className="quick-action-icon" style={{ backgroundColor: '#FF6B6B20' }}>
                                    <Icon icon="mdi:account-group" style={{ color: '#FF6B6B' }} />
                                </div>
                                <div className="quick-action-content">
                                    <h3 className="quick-action-title">Friends</h3>
                                    <p className="quick-action-subtitle">Connect with peers</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Horizontal Resources Card */}
            </div>
            )}
            
            <div className={`my-events-container ${isSearchFocused ? 'search-mode' : ''}`}>
                {isSearchFocused ? 
                    !searching && (
                        <div className="search-placeholder">
                            <Icon icon="mingcute:search-fill" />
                            <h3>Search Results</h3>
                            <p>Type in the search bar above to find events, rooms, or users</p>
                        </div>
                    )
                     : (
                    <>
                        {/* Featured Content for All Users */}
                        {!featuredLoading && (
                            <>
                                {/* Featured Events */}
                                {featuredEvents.length > 0 && (
                                    <div className="featured-section">
                                        <div className="section-header">
                                            <h3 className="section-title">Featured Events</h3>
                                            <button className="see-all-button" onClick={handleNavigateToEvents}>
                                                See all
                                                <Icon icon="mingcute:arrow-right-fill" />
                                            </button>
                                        </div>
                                        <div className="horizontal-scroll">
                                            {featuredEvents.slice(0, 5).map((event) => (
                                                <div 
                                                    key={event._id}
                                                    className="featured-event-card"
                                                    onClick={() => handleEventPress(event)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleEventPress(event);
                                                        }
                                                    }}
                                                >
                                                    <div className="event-image">
                                                        {event.image ? (
                                                            <img src={event.image} alt={event.title} />
                                                        ) : (
                                                            <div className="event-image-placeholder">
                                                                <Icon icon="mingcute:calendar-fill" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="event-content">
                                                        <div className="event-date-time">
                                                            <span className="event-date">
                                                                {new Date(event.start_time).toLocaleDateString('en-US', { 
                                                                    weekday: 'short', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </span>
                                                            <span className="event-time">
                                                                {new Date(event.start_time).toLocaleTimeString('en-US', { 
                                                                    hour: 'numeric', 
                                                                    minute: '2-digit',
                                                                    hour12: true 
                                                                })}
                                                            </span>
                                                        </div>
                                                        <h4 className="event-title">{event.title}</h4>
                                                        <p className="event-location">{event.location || 'Location TBD'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Featured Rooms */}
                                {featuredRooms.length > 0 && (
                                    <div className="featured-section">
                                        <div className="section-header">
                                            <h3 className="section-title">Available Study Rooms</h3>
                                            <button className="see-all-button" onClick={handleNavigateToRooms}>
                                                See all
                                                <Icon icon="mingcute:arrow-right-fill" />
                                            </button>
                                        </div>
                                        <div className="horizontal-scroll">
                                            {featuredRooms.slice(0, 5).map((room) => (
                                                <div 
                                                    key={room._id}
                                                    className="featured-room-card"
                                                    onClick={() => handleRoomPress(room)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleRoomPress(room);
                                                        }
                                                    }}
                                                >
                                                    <div className="room-image">
                                                        {room.image ? (
                                                            <img src={room.image} alt={room.name} />
                                                        ) : (
                                                            <div className="room-image-placeholder">
                                                                <Icon icon="ic:baseline-room" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="room-content">
                                                        <h4 className="room-name">{room.name}</h4>
                                                        <p className="room-building">{room.building || 'Unknown Building'}</p>
                                                        <div className="room-details">
                                                            <span className="room-capacity">
                                                                <Icon icon="mingcute:group-fill" />
                                                                {room.capacity || 'N/A'}
                                                            </span>
                                                            {room.average_rating > 0 && (
                                                                <span className="room-rating">
                                                                    <Icon icon="mingcute:star-fill" />
                                                                    {room.average_rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Call to Action for Non-Authenticated Users */}
                        {!isAuthenticated && (
                            <div className="cta-section">
                                <div className="cta-card">
                                    <div className="cta-icon">
                                        <Icon icon="mingcute:user-add-fill" />
                                    </div>
                                    <div className="cta-content">
                                        <h3>Join the Community</h3>
                                        <p>Create an account to RSVP to events, bookmark study rooms, and connect with friends.</p>
                                        <button 
                                            className="cta-button"
                                            onClick={() => navigate('/register')}
                                        >
                                            Sign Up Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Authenticated User Content */}
                        {isAuthenticated && (
                            <>
                                <RecommendedEvents />
                                <MyEventsContent />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default MyEvents;
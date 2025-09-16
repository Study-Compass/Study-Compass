import './MyEvents.scss';
import EventsGrad from '../../../assets/Gradients/EventsGrad.png';
import useAuth from '../../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { getFriends } from '../../../pages/Friends/FriendsHelpers.js';
import Search from '../../../components/Search/Search';

import RecommendedEvents from './RecommendedEvents/RecommendedEvents';
import MyEventsContent from './MyEventsContent/MyEventsContent';

function MyEvents({ onRoomNavigation }){
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searching, setSearching] = useState(false);

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

    return(
        <div className="my-events dash">
            <header className={`header ${isSearchFocused ? 'search-mode' : ''}`}>
                <img src={EventsGrad} alt="" />
                <h1>{welcomeText}, {user?.username || 'User'}</h1>
                <p>Check out your upcoming events and see top picks for you</p>
            </header>
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
                        <RecommendedEvents />
                        <MyEventsContent />
                    </>
                )}
            </div>
        </div>
    )
}

export default MyEvents;
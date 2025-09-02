import './MyEvents.scss';
import EventsGrad from '../../../assets/Gradients/EventsGrad.png';
import useAuth from '../../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { getFriends } from '../../../pages/Friends/FriendsHelpers.js';

import RecommendedEvents from './RecommendedEvents/RecommendedEvents';
import MyEventsContent from './MyEventsContent/MyEventsContent';

function MyEvents(){
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);

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

    return(
        <div className="my-events dash">
            <header className="header">
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
            <div className="my-events-container">
                <RecommendedEvents />
                <MyEventsContent />
            </div>
        </div>
    )
}

export default MyEvents;
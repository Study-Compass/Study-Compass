import React, {useState, useEffect} from 'react';
import './EventsDash.scss';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Dashboard from '../../components/Dashboard/Dashboard';
import Explore from './Explore/Explore';
import MyEvents from './MyEvents/MyEvents';
import Loader from '../../components/Loader/Loader';
import Orgs from './Orgs/Orgs';
import eventsLogo from '../../assets/Brand Image/BEACON.svg';
import useAuth from '../../hooks/useAuth';
import Friends from '../Friends/Friends';



function EventsDash({}){
    const [showLoading, setShowLoading] = useState(false);
    const { user, isAuthenticating } = useAuth();

    
    // Create menu items based on authentication status
    const getMenuItems = () => {
        const items = [
            { 
                label: 'Explore', 
                icon: 'mingcute:compass-fill',
                element: <Explore />
            }
        ];
        
        // Only add "My Events" if user is logged in
        if (user) {
            items.unshift({
                label: 'My Events', 
                icon: 'mingcute:calendar-fill',
                element: <MyEvents />
            });
            items.push({
                label: 'Friends', 
                icon: 'mingcute:calendar-fill',
                element: <Friends />
            });
        }
        
        return items;
    };

    const menuItems = getMenuItems();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoading(false);
        }, 2500); // 2s delay + 1.5s animation duration

        return () => clearTimeout(timer);
    }, []);



    return (
        <>
            {showLoading && !isAuthenticating && !user && (
                <div 
                    className="loading-overlay" 
                    role="status" 
                    aria-live="polite" 
                    aria-label="Loading events dashboard"
                >
                    <div className="loader-container">
                        <Loader />
                        <div className="loading-bar" aria-hidden="true"/>
                    </div>
                </div>
            )}
            <Dashboard 
                menuItems={menuItems} 
                additionalClass='events-dash' 
                logo={eventsLogo} 
                primaryColor='#6D8EFA' 
                secondaryColor='rgba(109, 142, 250, 0.15)'
                // Set default page to "My Events" (index 1) if user is logged in, otherwise "Explore" (index 0)
            >
            </Dashboard>
        </>
    )
}

export default EventsDash;
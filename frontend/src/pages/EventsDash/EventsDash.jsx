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


function EventsDash({  }){
    const [showLoading, setShowLoading] = useState(false);
    const menuItems = [
        { 
            label: 'Explore', 
            icon: 'mingcute:compass-fill',
            element: <Explore />
        },
        { 
            label: 'My Events', 
            icon: 'mingcute:calendar-fill',
            element: <MyEvents />
        },
        // { 
        //     label: 'Organizations',  
        //     icon: 'mingcute:calendar-fill',
        //     element: <Orgs/>
        // }
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoading(false);
        }, 2500); // 2s delay + 1.5s animation duration

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {showLoading && (
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
            <Dashboard menuItems={menuItems} additionalClass='events-dash' logo={eventsLogo} primaryColor='#BDB2FF' secondaryColor='rgba(189, 178, 255, 0.15)' >
            </Dashboard>
        </>
    )
}

export default EventsDash;
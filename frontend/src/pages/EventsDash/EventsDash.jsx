import React, {useState, useEffect} from 'react';
import './EventsDash.scss';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Dashboard from '../../components/Dashboard/Dashboard';
import Explore from './Explore/Explore';
import MyEvents from './MyEvents/MyEvents';
import Loader from '../../components/Loader/Loader';
import Orgs from './Orgs/Orgs';
import eventsLogo from '../../assets/Brand Image/EventsLogo.svg';


function EventsDash({  }){
    const [showLoading, setShowLoading] = useState(false);
    const menuItems = [
        { label: 'Explore', icon: 'mingcute:compass-fill' },
        { label: 'My Events', icon: 'mingcute:calendar-fill' },
        { label: 'Organizations',  icon: 'mingcute:calendar-fill' }
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
                <div className="loading-overlay">
                    <div className="loader-container">
                        <Loader />
                        <div className="loading-bar"/>
                    </div>
                </div>
            )}
            <Dashboard menuItems={menuItems} additionalClass='events-dash' logo={eventsLogo}>
                <Explore />
                <MyEvents />
                <Orgs/>
            </Dashboard>
        </>
    )
}

export default EventsDash;
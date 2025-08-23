import './MyEvents.scss';
import { useFetch } from '../../../hooks/useFetch';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';
import useAuth from '../../../hooks/useAuth';

import RecommendedEvents from './RecommendedEvents/RecommendedEvents';

function MyEvents(){
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;
    const { user } = useAuth();

    const [fetchType, setFetchType] = useState('future');
    const [sort, setSort] = useState('desc');
    const myEvents = useFetch(`/get-my-events?type=${fetchType}&sort=${sort}`);

    const selectorItems = [
        {
            label: 'Upcoming',
            value: 'future'
        },
        {
            label: 'Past',
            value: 'past'
        },
        {
            label: 'Archived',
            value: 'archived'
        }
    ]

    const handleFetchTypeChange = (value) => {
        setFetchType(value);
        setSort('desc');
    }


    return(
        <div className="my-events dash">
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>{welcomeText}, {user?.first_name || 'User'}</h1>
                <p>Check out your upcoming events and see top picks for you</p>
            </header>
            <div className="my-events-container">
                <RecommendedEvents />
                <div className='my-events-content'>
                    <div className="event-filters-bar">
                         <div className="event-filters">upcoming</div>
                         <div className="event-filters">hosting</div>
                         <div className="event-filters">past</div>
                         </div>
                </div>
            </div>
            </div>
    )
}

export default MyEvents;
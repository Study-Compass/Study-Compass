import React, {useState, useEffect} from 'react';
import './Explore.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import {useFetch} from '../../../hooks/useFetch';
import RPIlogo from '../../../assets/Rpi.png';
import compass from '../../../assets/Brand Image/discover.svg';
import FilterPanel from '../../../components/FilterPanel/FilterPanel';
import Event from '../../../components/EventsViewer/EventsGrid/EventsColumn/Event/Event';

function Explore(){
    const roles = [''];
    const [page, setPage] = useState(1);
    const limit = 15;

    // Define our available filter options.
    const filterOptions = {
        eventTypes: {
            label: "event type",
            options: ["study", "workshop", "meeting", "campus", "social", "sports"],
            optionValues: ["study", "workshop", "meeting", "campus", "social", "sports"],
            field: 'type'
        },
        eventCreator: {
            label: "event creator",
            options: ["student", "faculty", "administration", "organization", "sports"],
            optionValues: ["user", "faculty", "oie", "org", "sports"],
            field: 'creator'
        }
    };

    // Store raw selected filter values
    const [filters, setFilters] = useState({
        type: [],
        creator: []
    });

    // Build the API filters object
    const buildApiFilters = () => {
        const apiFilters = {};
        Object.keys(filters).forEach((field) => {
            if (filters[field].length) {
                apiFilters[field] = { "$in": filters[field] };
            }
        });
        return apiFilters;
    };

    // Build the filter query param as a JSON string
    const apiFilters = buildApiFilters();
    const filterParam = encodeURIComponent(JSON.stringify(apiFilters));

    const futureEvents = useFetch(`/get-future-events?roles=${roles}&page=${page}&limit=${limit}&filter=${filterParam}`);

    // Toggle a filter option on/off
    const toggleFilter = (field, value) => {
        setFilters(prev => {
            const currentValues = prev[field] || [];
            let newValues;
            if (currentValues.includes(value)) {
                newValues = currentValues.filter(val => val !== value);
            } else {
                newValues = [...currentValues, value];
            }
            return { ...prev, [field]: newValues };
        });
    };

    useEffect(() => {
        if(futureEvents.data){
            console.log(futureEvents.data);
        }
    }, [futureEvents.data]);

    // Helper function to format date
    const formatDate = (date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const eventDate = new Date(date);
        const isToday = eventDate.toDateString() === today.toDateString();
        const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();
        
        if (isToday) return 'Today';
        if (isTomorrow) return 'Tomorrow';
        
        return eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    // Helper function to group events by date
    const groupEventsByDate = (events) => {
        if (!events) return [];
        
        const groups = {};
        events.forEach(event => {
            const date = new Date(event.start_time).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(event);
        });
        
        return Object.entries(groups).map(([date, events]) => ({
            date: new Date(date),
            events
        })).sort((a, b) => a.date - b.date);
    };

    return(
        <div className="explore">
            <div className="heading">
                <h1>Explore Events at </h1>
                <img src={RPIlogo} alt="RPI Logo" />
            </div>
            <div className="explore-content">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <img src={compass} alt="compass" />
                        <h2>explore</h2>
                    </div>
                    <FilterPanel 
                        filterOptions={filterOptions}
                        filters={filters}
                        onFilterToggle={toggleFilter}
                    />
                </div>
                <div className="events">
                    {futureEvents.loading ? (
                        <div className="loading">Loading events...</div>
                    ) : futureEvents.error ? (
                        <div className="error">Error loading events</div>
                    ) : futureEvents.data ? (
                        <div className="events-list">
                            {groupEventsByDate(futureEvents.data.events).map(({ date, events }) => (
                                <div key={date.toISOString()} className="date-group">
                                    <div className="date-separator">{formatDate(date)}</div>
                                    {events.map(event => (
                                        <Event key={event._id} event={event} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default Explore;
import React, {useState, useEffect, useRef, useCallback} from 'react';
import './Explore.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import {useFetch} from '../../../hooks/useFetch';
import RPIlogo from '../../../assets/Rpi.png';
import compass from '../../../assets/Brand Image/discover.svg';
import FilterPanel from '../../../components/FilterPanel/FilterPanel';
import Event from '../../../components/EventsViewer/EventsGrid/EventsColumn/Event/Event';
import Switch from '../../../components/Switch/Switch';
import Month from '../../../pages/OIEDash/EventsCalendar/Month/Month';
import Week from '../../../pages/OIEDash/EventsCalendar/Week/Week';
import Day from '../../../pages/OIEDash/EventsCalendar/Day/Day';
import useAuth from '../../../hooks/useAuth';
import postRequest from '../../../utils/postRequest';
import { useNotification } from '../../../NotificationContext';
import Loader from '../../../components/Loader/Loader';
import eventsLogo from '../../../assets/Brand Image/EventsLogo.svg';
import exploreBackgroundGradient from '../../../assets/Gradients/ExploreBackgroundGradient.png';

const getSunday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
}

function Explore(){
    const {user} = useAuth();
    const {addNotification} = useNotification();
    const roles = [''];
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [events, setEvents] = useState([]);
    const limit = 15;
    const observer = useRef();
    const loadingRef = useRef(null);

    const [view, setView] = useState(0);
    const [viewType, setViewType] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => { //useEffect for window resizing
        function handleResize() {
          setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
  
  
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    // Define our available filter options.
    const filterOptions = {
        eventTypes: {
            label: "event type",
            options: [ "meeting", "campus", "study", "athletics", "alumni", "EMPAC"],
            optionValues: [ "meeting", "campus", "study", "sports", "alumni", "arts"],
            field: 'type'
        },
        eventCreator: {
            label: "event creator",
            options: ["student", "administration", "organization"],
            optionValues: ["User", "Admin", "Org"],
            field: 'hostingType'
        }
    };

    // Store raw selected filter values
    const [filters, setFilters] = useState({
        type: [],
        hostingType: []
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
    const filterParam = apiFilters;

    const { data, loading, error } = useFetch(`/get-future-events?roles=${roles}&page=${page}&limit=${limit}&filter=${JSON.stringify(filterParam)}`);

    // Handle intersection observer for infinite scroll
    const lastEventElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setTimeout(() => {
                    setPage(prevPage => prevPage + 1);
                }, 500);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Update events when new data arrives
    useEffect(() => {
        if (data) {
            if (page === 1) {
                setEvents(data.events);
            } else {
                // Filter out duplicates when adding new events
                setEvents(prevEvents => {
                    const existingIds = new Set(prevEvents.map(event => event._id));
                    const newEvents = data.events.filter(event => !existingIds.has(event._id));
                    return [...prevEvents, ...newEvents];
                });
            }
            setHasMore(data.events.length === limit);
        }
    }, [data, page]);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
        setEvents([]);
        setHasMore(true);
    }, [filters]);

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

    const changeView = (view) => {
        if(view === 0){
            //change to month

        } else if(view === 1){
            //change to week
            setSelectedDate(getSunday());
        } else if(view === 2){
            //change to day
            setSelectedDate(new Date());
        }
        setView(view);
    }

    // Helper function to group events by date
    const groupEventsByDate = (events) => {
        if (!events) return [];
        
        // Use a Map to ensure unique events per date
        const groups = new Map();
        events.forEach(event => {
            const date = new Date(event.start_time).toDateString();
            if (!groups.has(date)) {
                groups.set(date, []);
            }
            // Check if event already exists in the group
            const existingEvent = groups.get(date).find(e => e._id === event._id);
            if (!existingEvent) {
                groups.get(date).push(event);
            }
        });
        
        return Array.from(groups.entries()).map(([date, events]) => ({
            date: new Date(date),
            events
        })).sort((a, b) => a.date - b.date);
    };



    const groupedEvents = groupEventsByDate(events);

    return(
        <main className="explore" role="main" aria-label="Explore events">
            <header className="heading">
                <h1>Explore Events at </h1>
                <img src={RPIlogo} alt="RPI Logo" />
            </header>
            <div className="explore-content">
                {
                    width > 768 ? (
                        <aside className="sidebar" role="complementary" aria-label="Event filters and view options">
                            <div className="sidebar-header">
                                <img src={compass} alt="Compass icon" />
                                <h2>explore</h2>
                            </div>
                            <Switch
                                options={['list', 'calendar']}
                                selectedPass={viewType}
                                setSelectedPass={setViewType}
                                onChange={setViewType}
                                ariaLabel="View type selection"
                            />
                            {
                                viewType === 1 && (
                                    <section className="legend" aria-labelledby="legend-header">
                                        <div className="legend-header">
                                            <p id="legend-header">color legend</p>
                                        </div>
                                        <div className="legend-content" role="list" aria-label="Event type color legend">
                                            <div className="legend-item" role="listitem">
                                                <div className="legend-item-color" style={{backgroundColor: 'rgba(250, 117, 109, 1)'}} aria-label="Campus event color"></div>
                                                <p>campus</p>
                                            </div>
                                            <div className="legend-item" role="listitem">
                                                <div className="legend-item-color" style={{backgroundColor: '#5C5C5C'}} aria-label="Alumni event color"></div>
                                                <p>alumni</p>
                                            </div>
                                            <div className="legend-item" role="listitem">
                                                <div className="legend-item-color" style={{backgroundColor: '#6EB25F'}} aria-label="Athletics event color"></div>
                                                <p>athletics</p>
                                            </div>
                                            <div className="legend-item" role="listitem">
                                                <div className="legend-item-color" style={{backgroundColor: '#FBEBBB'}} aria-label="Arts event color"></div>
                                                <p>arts</p>
                                            </div>
                                        </div>
                                    </section>

                                )
                            }
                            <FilterPanel 
                                filterOptions={filterOptions}
                                filters={filters}
                                onFilterToggle={toggleFilter}
                            />
                        </aside>
                    )
                    :
                    (
                        <aside className="sidebar mobile-sidebar" role="complementary" aria-label="Event filters and view options">
                            <div className="sidebar-header">
                                <div className="logo">
                                    <img src={compass} alt="Compass icon" />
                                    <h2>explore</h2>
                                </div>
                                <Switch
                                    options={['list', 'calendar']}
                                    selectedPass={viewType}
                                    setSelectedPass={setViewType}
                                    onChange={setViewType}
                                    ariaLabel="View type selection"
                                />
                            </div>
                            {/* <FilterPanel 
                                filterOptions={filterOptions}
                                filters={filters}
                                onFilterToggle={toggleFilter}
                            /> */}

                        </aside>

                    )
                }
                <section className="explore-events" role="region" aria-label="Events display">
                    {loading && page === 1 ? (
                        <div className="loading" role="status" aria-live="polite">Loading events...</div>
                    ) : error ? (
                        <div className="error" role="alert">Error loading events</div>
                    ) : viewType === 0 ? (
                        events.length > 0 ? (
                            <div className="events-list" role="list" aria-label="Events list">
                                {groupedEvents.map(({ date, events }, groupIndex) => (
                                    <div key={date.toISOString()} className="date-group" role="group" aria-label={`Events on ${formatDate(date)}`}>
                                        <div className="date-separator" role="heading" aria-level="2">{formatDate(date)}</div>
                                        {events.map((event, eventIndex) => {
                                            const isLastElement = groupIndex === groupedEvents.length - 1 && 
                                                               eventIndex === events.length - 1;
                                            return (
                                                <div 
                                                    key={`${event._id}-${eventIndex}`}
                                                    ref={isLastElement ? lastEventElementRef : null}
                                                    role="listitem"
                                                >
                                                    <Event event={event} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                                <Loader />
                                {loading && page > 1 && (
                                    <div ref={loadingRef} className="loading-more" role="status" aria-live="polite">
                                        Loading more events...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-events" role="status">No events found</div>
                        )
                    ) : (
                        view === 0 ?
                        <Month 
                            height={'calc(100% - 44px)'} 
                            filter={filterParam} 
                            changeToWeek={(date) => {
                                setSelectedDate(date);
                                setView(1);
                            }} 
                            view={view} 
                            setView={changeView}
                        />
                        : view === 1 ?
                        <Week 
                            height={'calc(100% - 44px)'} 
                            filter={filterParam} 
                            start={selectedDate}
                            changeToDay={(date) => {
                                setSelectedDate(date);
                                setView(2);
                            }} 
                            view={view} 
                            setView={changeView}
                        />
                        :
                        <Day 
                            height={'calc(100% - 44px)'} 
                            filter={filterParam} 
                            start={selectedDate}
                            view={view} 
                            setView={changeView}
                        />
                    )}
                </section>
            </div>
        </main>
    )
}

export default Explore;
import React, { useEffect, useState } from 'react';
import './ManageEvents.scss';
import OIEGradient from '../../../assets/OIE-Gradient.png';
import { getAllEvents, getOIEEvents } from '../../../components/EventsViewer/EventHelpers';
import OIEEvent from '../OIEEventsComponents/Event/OIEEvent';
import { useFetch } from '../../../hooks/useFetch';

function ManageEvents({expandedClass}){

    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [rejectedEvents, setRejectedEvents] = useState([]);

    const fetchEvents = useFetch('/get-all-events');
    const fetchPendingEvents = useFetch('/oie/get-pending-events');
    const fetchRejectedEvents = useFetch('/oie/get-rejected-events');
    const fetchApprovedEvents = useFetch('/oie/get-approved-events');

    useEffect(() => {
        if(fetchEvents.data){
            const allEvents = fetchEvents.data.events;
            //sort by dates
            allEvents.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });
            allEvents.reverse();
            setEvents(allEvents);
        }
        if(fetchPendingEvents.data){
            const allEvents = fetchPendingEvents.data.events;
            //sort by dates
            allEvents.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            });
            allEvents.reverse();
            setPendingEvents(allEvents);
        }
    }, [fetchEvents.data, fetchPendingEvents.data]);

    useEffect(() => {
        if(fetchRejectedEvents.data){
            const allEvents = fetchRejectedEvents.data.events;
            console.log(allEvents);
            //sort by dates
            allEvents.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            }
            );
            allEvents.reverse();
            setRejectedEvents(allEvents);
        }
        if(fetchApprovedEvents.data){
            const allEvents = fetchApprovedEvents.data.events;
            //sort by dates
            allEvents.sort((a, b) => {
                return new Date(a.date) - new Date(b.date);
            }
            );
            allEvents.reverse();
            setApprovedEvents(allEvents);
        }
    }, [fetchRejectedEvents.data, fetchApprovedEvents.data]);

    const refetch = () => {
        fetchEvents.refetch();
        fetchPendingEvents.refetch();
        fetchRejectedEvents.refetch();
        fetchApprovedEvents.refetch();
    }

    return (
        <div className={`manage-events ${expandedClass}`}>
            <div className="panel">
                <h1>Event Board</h1>
            </div>
            <div className="events-col">
                <div className="header">
                    <h1>pending events</h1>
                </div>
                <div className="content">
                    {
                        pendingEvents.map((event, index) => {
                            if(index < 5){
                                return (
                                    <OIEEvent event={event} key={index} refetch={refetch} showOIE={true} index={index}/>
                                )
                            }
                        })
                    }
                    {
                        fetchPendingEvents.loading && <div className="no-events shimmer">
                        </div>
                    }
                </div>
            </div>
            <div className="events-col">
                <div className="header">
                    <h1>approved events</h1>
                </div>
                <div className="content">
                    {
                        approvedEvents.map((event, index) => {
                            return (
                                <OIEEvent event={event} key={index} refetch={refetch} showOIE={true} index={index}/>
                            )
                        })
                    }
                    {
                        fetchApprovedEvents.loading && <div className="no-events shimmer">
                        </div>
                    }
                    {
                        approvedEvents.length === 0 && !fetchApprovedEvents.loading && <div className="no-events">
                        </div>
                    }
                </div>
            </div>
            <div className="events-col">
                <div className="header">
                    <h1>rejected events</h1>
                </div>
            <div className="content">
                    {
                        rejectedEvents.map((event, index) => {
                            return (
                                <OIEEvent event={event} key={index} refetch={refetch} showOIE={true} index={index}/>
                            )
                        })
                    }
                    {
                        fetchRejectedEvents.loading && <div className="no-events shimmer">
                        </div>
                    }
                    {
                        rejectedEvents.length === 0 && !fetchRejectedEvents.loading && <div className="no-events">
                        </div>
                    }
                    
                </div>
            </div>
            <div className="events-col">
                <div className="header">
                    <h1>other events</h1>
                </div>
            <div className="content">
                    {
                        events.map((event, index) => {
                            return (
                                <OIEEvent event={event} key={index} refetch={refetch} showOIE={true} index={index}/>
                            )
                        })
                    }
                    {
                        fetchEvents.loading && <div className="no-events shimmer">
                        </div>
                    }
                    {
                        events.length === 0 && !fetchRejectedEvents.loading && <div className="no-events">
                        </div>
                    }
                    
                </div>
            </div>
        </div>
    )
}


export default ManageEvents;
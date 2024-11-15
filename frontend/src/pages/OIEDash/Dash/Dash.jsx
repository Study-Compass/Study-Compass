import React, { useEffect, useState } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/OIE-Gradient.png';
import { getAllEvents, getOIEEvents } from '../../../components/EventsViewer/EventHelpers';
import OIEEvent from '../OIEEventsComponents/Event/OIEEvent';

function Dash({expandedClass}){

    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async (pending) => {
            try{
                const allEvents = pending ? await getOIEEvents() : await getAllEvents();
                //sort by dates
                allEvents.sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
                allEvents.reverse();
                if(pending){
                    setPendingEvents(allEvents);
                } else {
                    setEvents(allEvents);
                }
                console.log(allEvents);
            } catch (error){
                console.log("Failed to fetch events", error);
            }

        }
        fetchEvents(true);
        fetchEvents(false);
    }, []);


    return (
        <div className={`dash ${expandedClass}`}>
            <header className="header">
                <img src={OIEGradient} alt="" />
                <h1>OIE Dashboard</h1>
            </header>
            <div className="needs-approval">
                <h1>events pending approval</h1>
                <div className="content">
                    {
                        pendingEvents.map((event, index) => {
                            if(index < 5){
                                return (
                                    <OIEEvent event={event} key={index}/>
                                )
                            }
                        })
                    }
                </div>
            </div>
            <div className="needs-approval">
                <h1>events coming up</h1>
                <div className="content">
                    {
                        events.map((event, index) => {
                            if(index < 3){
                                return (
                                    <OIEEvent event={event} key={index}/>
                                )
                            }
                        })
                    }
                </div>
            </div>
        </div>
    )
}


export default Dash;
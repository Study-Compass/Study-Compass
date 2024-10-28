import React, { useEffect, useState } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/OIE-Gradient.png';
import { getAllEvents } from '../../../components/EventsViewer/EventHelpers';
import OIEEvent from '../OIEEventsComponents/Event/OIEEvent';

function Dash({expandedClass}){

    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try{
                const allEvents = await getAllEvents();
                //sort by date
                allEvents.sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
                allEvents.reverse();
                //add dummy first element
                setEvents(allEvents);
                console.log(allEvents);
            } catch (error){
                console.log("Failed to fetch events", error);
            }

        }
        fetchEvents();
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
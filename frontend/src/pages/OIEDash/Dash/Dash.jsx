import React, { useEffect, useState, useRef } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/OIE-Gradient.png';
import { getAllEvents, getOIEEvents } from '../../../components/EventsViewer/EventHelpers';
import OIEEvent from '../OIEEventsComponents/Event/OIEEvent';
import { useFetch } from '../../../hooks/useFetch';
import Week from '../EventsCalendar/Week/Week';

function Dash({expandedClass, change, name}){

    const [events, setEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);

    const fetchEvents = useFetch('/get-all-events');
    const fetchPendingEvents = useFetch('/oie/get-pending-events');

    const weeklyRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if(weeklyRef.current){
            setTimeout(() => {  
                setHeight(weeklyRef.current.clientHeight);
            }, 1000);
        }
    }, [weeklyRef]);

    const getSunday = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        return new Date(today.setDate(diff));
    }

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

    const refetch = () => {
        fetchEvents.refetch();
        fetchPendingEvents.refetch();
    }

    const changeToDay = (day) => {
        
    }

    return (
        <div className={`dash ${expandedClass}`}>
            <header className="header">
                <img src={OIEGradient} alt="" />
                <h1>{name} Dashboard</h1>
            </header>
            <div className="needs-approval">
                <div className="approval-header">
                    <h1>events pending approval</h1>
                    <button onClick={()=>change(2)}><p>see all</p></button>
                </div>
                <div className="content">
                    {
                        pendingEvents.map((event, index) => {
                            if(index < 5){
                                return (
                                    <OIEEvent event={event} key={index} refetch={refetch} showOIE={true}/>
                                )
                            }
                        })
                    }
                </div>
            </div>
            <div className="week-container" ref={weeklyRef}>    
                {
                    height !== 0 &&
                    <Week changeToDay={changeToDay} startingText='this week at a glance' nav={false} height={height-50} start={getSunday()} filter={{}}/>
                }
            </div>
        </div>
    )
}


export default Dash;
import './MyEvents.scss';
import CreateEventButton from '../../../components/EventsViewer/EventsGrid/EventsColumn/CreateEventButton/CreateEvent';
import { useFetch } from '../../../hooks/useFetch';
import { useState, useEffect } from 'react';

function MyEvents(){
    const myEvents = useFetch('/get-my-events');

    useEffect(()=>{
        console.log(myEvents.data);
    },[myEvents.data]);

    return(
        <div className="my-events">
            <CreateEventButton />
        </div>
    )
}

export default MyEvents;
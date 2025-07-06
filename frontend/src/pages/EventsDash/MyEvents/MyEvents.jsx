import './MyEvents.scss';
import CreateEventButton from '../../../components/EventsViewer/EventsGrid/EventsColumn/CreateEventButton/CreateEvent';
import { useFetch } from '../../../hooks/useFetch';
import { useState, useEffect } from 'react';
import OIEEvent from '../../OIEDash/OIEEventsComponents/Event/OIEEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import EventsManager from '../../../components/EventsManager/EventsManager';

function MyEvents(){

    const [fetchType, setFetchType] = useState('future');
    const [sort, setSort] = useState('desc');
    const myEvents = useFetch(`/get-my-events?type=${fetchType}&sort=${sort}`);

    const selectorItems = [
        {
            label: 'upcoming',
            value: 'future'
        },
        {
            label: 'past',
            value: 'past'
        },
        {
            label: 'archived',
            value: 'archived'
        }
    ]

    const handleFetchTypeChange = (value) => {
        setFetchType(value);
        setSort('desc');
    }


    return(
        <div className="my-events">
            <div className="heading">
                <h1>My Events</h1>
            </div>
            <div className="event-button-container">
                <CreateEventButton row={true} color="red"/>
            </div>
            <EventsManager events={myEvents.data?.events} refetch={myEvents.refetch} selectorItems={selectorItems} handleTabChange={handleFetchTypeChange} fetchType={fetchType} />
        </div>
    )
}

export default MyEvents;
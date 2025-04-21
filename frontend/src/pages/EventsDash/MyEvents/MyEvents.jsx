import './MyEvents.scss';
import CreateEventButton from '../../../components/EventsViewer/EventsGrid/EventsColumn/CreateEventButton/CreateEvent';
import { useFetch } from '../../../hooks/useFetch';
import { useState, useEffect } from 'react';
import OIEEvent from '../../OIEDash/OIEEventsComponents/Event/OIEEvent';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

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

    useEffect(()=>{
        console.log(myEvents.data);
    },[myEvents.data]);

    return(
        <div className="my-events">
            <div className="heading">
                <h1>My Events</h1>
            </div>
            <div className="event-button-container">
                <CreateEventButton row={true} color="red"/>
            </div>
            <div className="item-container">
                <div className="item-header">
                    <div className="header-row">
                        <div>
                            <Icon icon="mingcute:calendar-fill" />
                            <h2>
                                events
                            </h2>
                        </div>
                    </div>
                    <div className="selector-row">
                        { 
                            selectorItems.map((item)=>(
                                <div className={`selector-item ${item.value === fetchType ? 'selected' : ''}`} key={item.value} onClick={()=>handleFetchTypeChange(item.value)}>
                                    <h3>
                                        {item.label}
                                    </h3>
                                </div>
                            ))
                        }
                        
                    </div>
                </div>
                <div className="items-container">
                    <div className="items item-grid">
                        {myEvents.data && myEvents.data.events.map((event)=>(
                            <OIEEvent key={event._id} event={event} showOIE={event.approvalReference} manage={true} refetch={myEvents.refetch} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MyEvents;
import React, { useEffect, useState } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/ClubGradient.png';
import { getAllEvents } from '../../../components/EventsViewer/EventHelpers';
import clubEvent from '../ClubEventsComponents/Event/ClubEvent';
import people from '../../../assets/people.svg'
import RedGrad from '../../../assets/Gradients/ClubAdminGrad.png';
import { Icon } from '@iconify-icon/react';
import CreateEvent from '../../../components/EventsViewer/EventsGrid/EventsColumn/CreateEventButton/CreateEvent';
import ClubEvent from '../ClubEventsComponents/Event/ClubEvent';

function Dash({expandedClass, openMembers, clubName, meetings}){
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;
    
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

    const handleEventClick = () => {
        console.log("create event");
    }



    return (
        <div className={`dash ${expandedClass}`}>
            <img src={RedGrad} alt="" className="red-grad"/>
            <header className="header">
                <h1>{welcomeText}, {clubName}</h1>
                <h3>welcome back to your organization portal</h3>
            </header>
            <div className="row">
                <div className="column">
                <h1>manage membership</h1>
                <div className="content membership">
                        <h2><img src={people} alt="" />200 members <button onClick={openMembers}>manage</button></h2>
                        <h2> <img src={people} alt="" />8 officers <button>manage</button></h2>
                </div>
                </div>
                <div className="column">
                <h1>quick actions</h1>
                <CreateEvent origin={clubName}/>

               </div>
                
            </div>
            <div className="row">
                <div className="column">
                    <h1>upcoming events</h1>
                    <div className="meeting">
                        {
                            meetings && meetings.events && meetings.events.length > 0 ? meetings.events.map((meeting, index) => {
                                //check if meeting is upcoming or past
                                if(new Date(meeting.start_time) > new Date()){
                                    return <ClubEvent key={index} event={meeting} />
                                }
                            }) : <h2>no meetings scheduled</h2>
                        }
                    </div>
                </div>
            </div>

        </div>

                    

        
    )
}


export default Dash;
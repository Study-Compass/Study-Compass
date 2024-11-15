import React, { useEffect, useState } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/ClubGradient.png';
import { getAllEvents } from '../../../components/EventsViewer/EventHelpers';
import clubEvent from '../ClubEventsComponents/Event/ClubEvent';
import people from '../../../assets/people.svg'


function Dash({expandedClass, openMembers}){

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
                <h1>Club Dashboard</h1>
            </header>
            <div className="needs-approval">
                <div className="column">
                <h1>manage membership</h1>

                <div className="content">
                        <h2><img src={people} alt="" />200 members <button onClick={openMembers}>manage</button></h2>
                        <h2> <img src={people} alt="" />8 officers <button>manage</button></h2>
                </div>


                <h1>quick actions</h1>
                </div>
                <div className="column">
                <h1>meetings coming up</h1>
                <div className="content meeting">
                        <h2>Random Student Event <button>manage</button></h2>
                </div>

               </div>
                
            </div>

        </div>

                    

        
    )
}


export default Dash;
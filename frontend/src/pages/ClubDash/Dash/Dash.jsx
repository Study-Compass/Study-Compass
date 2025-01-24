import React, { useEffect, useState } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/ClubGradient.png';
import { getAllEvents } from '../../../components/EventsViewer/EventHelpers';
import clubEvent from '../ClubEventsComponents/Event/ClubEvent';
import people from '../../../assets/people.svg'
import RedGrad from '../../../assets/Gradients/ClubAdminGrad.png';


function Dash({expandedClass, openMembers, clubName}){
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
                <h1>meetings coming up</h1>
                <div className="content meeting">
                    <h2>Random Student Event <button>manage</button></h2>
                </div>

               </div>
                
            </div>
            <div className="row">
                <div className="column">
                    <h1>quick actions</h1>
                    <div className="content">
                    </div>
                </div>
            </div>

        </div>

                    

        
    )
}


export default Dash;
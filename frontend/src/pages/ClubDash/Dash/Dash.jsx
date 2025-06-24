import React, { useEffect, useState, useRef } from 'react';
import './Dash.scss';
import OIEGradient from '../../../assets/ClubGradient.png';
import { getAllEvents } from '../../../components/EventsViewer/EventHelpers';
import clubEvent from '../ClubEventsComponents/Event/ClubEvent';
import people from '../../../assets/people.svg'
import OrgGrad from '../../../assets/Gradients/OrgGrad.png';
import { Icon } from '@iconify-icon/react';
import Week from '../../../pages/OIEDash/EventsCalendar/Week/Week';
import CreateEventButton from '../../../components/EventsViewer/EventsGrid/EventsColumn/CreateEventButton/CreateEvent';
import Notification from '../../../components/Notification/Notification';

function Dash({ expandedClass, openMembers, clubName, meetings, org }) {
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;

    const [events, setEvents] = useState([]);
    const weeklyRef = useRef(null);
    const [height, setHeight] = useState(0);

    const filter = {
        "hostingId": { "$eq": org.org.overview._id }
    }

    console.log(filter);

    useEffect(() => {
        if (weeklyRef.current) {
            const height = weeklyRef.current.clientHeight;
            setHeight(height);
        }
    }, []);

    const handleEventClick = () => {
        console.log("create event");
    }

    return (
        <div className={`dash ${expandedClass}`}>
            <header className="header">
                <h1>{welcomeText}, {clubName}</h1>
                <p>welcome back to your organization portal</p>
                <img src={OrgGrad} alt="" />
            </header>
            <div className="org-content">
                <div className="row stats">
                    <div className="stat">
                        <h4>Upcoming Events</h4>
                        <div className="count">
                            <h1>{org.exhaustive.eventCount}</h1>
                        </div>
                    </div>
                    <div className="stat">
                        <h4>Pending Submissions</h4>
                        <div className="count">
                            <h1>3</h1>
                        </div>
                    </div>
                    <div className="stat">
                        <h4>This Week's Meetings</h4>
                        <div className="count">
                            <h1>10</h1>
                        </div>
                    </div>
                    <div className="stat">
                        <h4>Members</h4>
                        <div className="count">
                            <h1>100</h1>
                        </div>
                    </div>

                </div>
                <div className="row activity">
                    <div className="column activity">
                        <div className="header">
                            <h3>Recent Activity</h3>
                            <button>view all</button>
                        </div>
                        <div className="activity">
                            <Notification title="'Night Market' approved" description="Event 1 description" time={new Date()}/> 
                        </div>
                    </div>
                    <div className="column quick-actions">
                        <div className="header">
                            <h3>Quick Actions</h3>
                        </div>
                        <div className="quick-actions">
                            <CreateEventButton row={true} color="red"/>
                        </div>
                    </div>
                </div>
                <div className="week-container" ref={weeklyRef}>
                    {
                        height !== 0 &&
                        <Week height={`${height-50}px`} changeToDay={() => { }} start={new Date()} nav={false} filter={filter} showSwitch={false} startingText="this week at a glance"/>
                    }
                </div>

            </div>

        </div>




    )
}


export default Dash;
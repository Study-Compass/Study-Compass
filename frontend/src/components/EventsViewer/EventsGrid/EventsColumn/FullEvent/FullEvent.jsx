import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../../assets/StarGradient.png'
import MockPoster from '../../../../../assets/MockPoster.png'
import defaultAvatar from '../../../../../assets/defaultAvatar.svg'
import useAuth from '../../../../../hooks/useAuth';
import { useNotification } from '../../../../../NotificationContext';
import postRequest from '../../../../../utils/postRequest';
import { useFetch } from '../../../../../hooks/useFetch';

function FullEvent({ event }){
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addNotification } = useNotification();
    
    const [rsvpStatus, setRsvpStatus] = useState(null);
    const [rsvpStats, setRsvpStats] = useState(null);
    const [attendees, setAttendees] = useState({ going: [], maybe: [], notGoing: [] });
    const [friendsGoing, setFriendsGoing] = useState(0);
    const [loading, setLoading] = useState(false);

    console.log(event);

    // Use useFetch for RSVP data
    const { data: rsvpData } = useFetch(
        event.rsvpEnabled && user ? `/my-rsvp/${event._id}` : null
    );

    const { data: attendeesData } = useFetch(
        event.rsvpEnabled ? `/attendees/${event._id}` : null
    );

    useEffect(() => {
        if (rsvpData?.success) {
            setRsvpStatus(rsvpData.rsvp);
        }
    }, [rsvpData]);

    useEffect(() => {
        if (attendeesData?.success) {
            setAttendees(attendeesData.attendees);
            setRsvpStats(attendeesData.rsvpStats);
            setFriendsGoing(attendeesData.friendsGoing);
        }
    }, [attendeesData]);

    const handleRSVP = async (status) => {
        if (!user) {
            addNotification({
                title: "Login Required",
                message: "Please log in to RSVP to events",
                type: "error"
            });
            return;
        }

        setLoading(true);
        try {
            const response = await postRequest(`/rsvp/${event._id}`, {
                status,
                guestCount: 1
            });

            if (response.success) {
                setRsvpStatus({ status, guestCount: 1, rsvpDate: new Date() });
                // Refresh attendees data
                window.location.reload(); // Simple refresh for now
                addNotification({
                    title: "RSVP Updated",
                    message: `You are now ${status === 'going' ? 'going' : status === 'maybe' ? 'maybe going' : 'not going'} to this event`,
                    type: "success"
                });
            } else {
                addNotification({
                    title: "RSVP Failed",
                    message: response.error || "Failed to update RSVP",
                    type: "error"
                });
            }
        } catch (error) {
            addNotification({
                title: "RSVP Failed",
                message: error.message || "Failed to update RSVP",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = () => {
        navigate(`/create-event`);
    }
    const date = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);
    
    const renderHostingStatus = () => {
        let hostingImage = '';
        let hostingName = '';
        let level = '';
        if(!event.hostingType){
            return;
        }
        if(event.hostingType === "User"){
            hostingImage = event.hostingId.image ? event.hostingId.image : defaultAvatar;
            hostingName = event.hostingId.name;
            if(event.hostingId.roles.includes("developer")){
                level = "Developer";
            } else if(event.hostingId.roles.includes("oie")){
                level = "Faculty";
            } else {
                level = "Student";
            }
        } else {
            hostingImage = event.hostingId.org_profile_image;
            hostingName = event.hostingId.org_name;
            level = "Organization";
        }
        return (
            <div className={`row hosting ${level.toLowerCase()}`} onClick={()=>{level === "Organization" && navigate(`/org/${hostingName}`)}}>
                <p>Hosted by</p>
                <img src={hostingImage} alt="" />
                <p className="user-name">{hostingName}</p>
                <div className={`level ${level.toLowerCase()}`}>
                    {level}
                </div>
            </div>
        );
    }

    const renderRSVPSection = () => {
        if (!event.rsvpEnabled) return null;

        const isRSVPDeadlinePassed = event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline);
        const isAtCapacity = event.maxAttendees && rsvpStats && rsvpStats.going >= event.maxAttendees;

        return (
            <div className="rsvp-section">
                <div className="rsvp-header">
                    <h3>Guest List</h3>
                    <div className="rsvp-stats-container">
                        {rsvpStats && (
                            <div className="rsvp-stats">
                                <div className="stat">
                                    <span className="count">{rsvpStats.going}</span>
                                    <span className="label">Going</span>
                                </div>
                                <div className="stat">
                                    <span className="count">{rsvpStats.maybe}</span>
                                    <span className="label">Maybe</span>
                                </div>
                                {/* <div className="stat">
                                    <span className="count">{rsvpStats.notGoing}</span>
                                    <span className="label">Not Going</span>
                                </div> */}
                            </div>
                        )}
                        {friendsGoing > 0 && (
                            <div className="friends-going">
                                <Icon icon="mdi:account-group" />
                                <span>{friendsGoing} friend{friendsGoing !== 1 ? 's' : ''} going</span>
                            </div>
                        )}
                    </div>
                </div>
                



                {isRSVPDeadlinePassed && (
                    <div className="rsvp-deadline-passed">
                        <Icon icon="mdi:clock-alert" />
                        <span>RSVP deadline has passed</span>
                    </div>
                )}

                {isAtCapacity && (
                    <div className="rsvp-capacity-reached">
                        <Icon icon="mdi:account-multiple-remove" />
                        <span>Event is at capacity</span>
                    </div>
                )}

                {attendees.going.length > 0 && (
                    <div className="attendees-section">
                        <h4>Who's Going ({attendees.going.length})</h4>
                        <div className="attendees-list">
                            {attendees.going.slice(0, 6).map((attendee, index) => (
                                <div key={attendee.userId._id} className="attendee">
                                    <img 
                                        src={attendee.userId.picture || defaultAvatar} 
                                        alt={attendee.userId.name || attendee.userId.username}
                                    />
                                </div>
                            ))}
                            {attendees.going.length > 6 && (
                                <div className="more-attendees">
                                    +{attendees.going.length - 6} more
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {user && !isRSVPDeadlinePassed && (
                    <div className="rsvp-buttons">
                        <button 
                            className={`rsvp-btn going ${rsvpStatus?.status === 'going' ? 'active' : ''} ${isAtCapacity ? 'disabled' : ''}`}
                            onClick={() => !isAtCapacity && handleRSVP('going')}
                            disabled={loading || isAtCapacity}
                        >
                            <Icon icon="mdi:check" />
                            Going
                        </button>
                        <button 
                            className={`rsvp-btn maybe ${rsvpStatus?.status === 'maybe' ? 'active' : ''}`}
                            onClick={() => handleRSVP('maybe')}
                            disabled={loading}
                        >
                            <Icon icon="mdi:help" />
                            Maybe
                        </button>
                        <button 
                            className={`rsvp-btn not-going ${rsvpStatus?.status === 'not-going' ? 'active' : ''}`}
                            onClick={() => handleRSVP('not-going')}
                            disabled={loading}
                        >
                            <Icon icon="mdi:close" />
                            Not Going
                        </button>
                    </div>
                )}

            </div>
        );
    };

    return(
        <div className="full-event">
                { event.image &&
                    <div className="image-container">
                        <img src={event.image ? event.image : ""} alt="" className=""/>
                    </div>
                }
            <div className="event-content">
                <h1>{event.name}</h1>
                <div className="col">
                    <div className="row event-detail date">
                        <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                    </div>
                    <div className="row event-detail time">
                        <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})} -  {dateEnd.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>
                    </div>
                    <div className="row event-detail location">
                        <Icon icon="fluent:location-28-filled" />
                        <p>{event.location}</p>
                    </div>
                </div>
                {renderHostingStatus()}

                <div className="row event-description">
                    <p>{event.description}</p>
                </div>
                {
                        event.externalLink &&
                        <div className="row external-link">
                            <a href={event.externalLink} target="_blank" rel="noopener noreferrer">
                                <Icon icon="heroicons:arrow-top-right-on-square-20-solid" />
                                <p>View Event External Link</p>
                            </a>
                        </div>
                    }
                {renderRSVPSection()}
            </div>
            <img src={StarGradient} alt="" className="gradient" />
        </div>
    );

}

export default FullEvent;
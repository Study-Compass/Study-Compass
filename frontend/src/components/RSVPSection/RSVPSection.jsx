import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import useAuth from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import RSVPButton from '../RSVPButton/RSVPButton';
import defaultAvatar from '../../assets/defaultAvatar.svg';
import './RSVPSection.scss';

const RSVPSection = ({ event }) => {
    const { user } = useAuth();
    const [rsvpStatus, setRsvpStatus] = useState(null);
    const [attendees, setAttendees] = useState({ going: [], maybe: [], notGoing: [] });
    const [rsvpStats, setRsvpStats] = useState(null);
    const [friendsGoing, setFriendsGoing] = useState(0);

    // Fetch RSVP data for this specific event
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
            // Use friends data from attendees endpoint if available, otherwise use from event data
            setFriendsGoing(attendeesData.friendsGoing || event.friendsGoing || 0);
        }
    }, [attendeesData, event]);

    const handleRSVPUpdate = (rsvpData) => {
        // Refresh attendees data when RSVP is updated
        window.location.reload();
    };

    const handleRSVPStatusUpdate = (eventId, newRSVPStatus) => {
        setRsvpStatus(newRSVPStatus);
    };

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

            {/* Use the RSVPButton component */}
            <RSVPButton 
                event={event} 
                onRSVPUpdate={handleRSVPUpdate} 
                rsvpStatus={rsvpStatus}
                onRSVPStatusUpdate={handleRSVPStatusUpdate}
            />
        </div>
    );
};

export default RSVPSection;

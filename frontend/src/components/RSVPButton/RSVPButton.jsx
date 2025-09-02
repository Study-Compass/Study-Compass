import React, { useState } from 'react';
import { Icon } from '@iconify-icon/react';
import useAuth from '../../hooks/useAuth';
import { useNotification } from '../../NotificationContext';
import postRequest from '../../utils/postRequest';
import './RSVPButton.scss';

const RSVPButton = ({ event, onRSVPUpdate, rsvpStatus, onRSVPStatusUpdate }) => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleRSVP = async (status, domEvent) => {
        // Prevent event propagation to avoid triggering parent click handlers
        if (domEvent) {
            domEvent.stopPropagation();
        }
        
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
                const newRSVPStatus = { status: status };
                
                // Update parent component's RSVP data
                if (onRSVPStatusUpdate) {
                    onRSVPStatusUpdate(event._id, newRSVPStatus);
                }
                
                if (onRSVPUpdate) {
                    onRSVPUpdate({status});
                }
                
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

    if (!event.rsvpEnabled) {
        return null;
    }

    const isRSVPDeadlinePassed = event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline);
    const isAtCapacity = event.maxAttendees && event.rsvpStats && event.rsvpStats.going >= event.maxAttendees;

    if (isRSVPDeadlinePassed) {
        return (
            <div className="rsvp-button deadline-passed">
                <Icon icon="mdi:clock-alert" />
                <span>RSVP Closed</span>
            </div>
        );
    }

    if (isAtCapacity && rsvpStatus?.status !== 'going') {
        return (
            <div className="rsvp-button capacity-reached">
                <Icon icon="mdi:account-multiple-remove" />
                <span>Full</span>
            </div>
        );
    }

    return (
        <div className="rsvp-button-container">
            <button
                className={`rsvp-btn going ${rsvpStatus?.status === 'going' ? 'active' : ''} ${isAtCapacity ? 'disabled' : ''}`}
                onClick={(e) => !isAtCapacity && handleRSVP('going', e)}
                disabled={loading || isAtCapacity}
                title="I'm going"
            >
                <Icon icon="mdi:check" />
                {rsvpStatus?.status === 'going' ? 'Going' : 'Going'}
            </button>
            <button
                className={`rsvp-btn maybe ${rsvpStatus?.status === 'maybe' ? 'active' : ''}`}
                onClick={(e) => handleRSVP('maybe', e)}
                disabled={loading}
                title="Maybe"
            >
                <Icon icon="mdi:help" />
                {rsvpStatus?.status === 'maybe' ? 'Maybe' : 'Maybe'}
            </button>
            <button
                className={`rsvp-btn not-going ${rsvpStatus?.status === 'not-going' ? 'active' : ''}`}
                onClick={(e) => handleRSVP('not-going', e)}
                disabled={loading}
                title="Not going"
            >
                <Icon icon="mdi:close" />
                {rsvpStatus?.status === 'not-going' ? 'Not Going' : 'Not Going'}
            </button>
        </div>
    );
};

export default RSVPButton;

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./RecommendedEvents.scss";
import axios from "axios";

import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../../../NotificationContext";
import HeaderContainer from "../../../../components/HeaderContainer/HeaderContainer";
import EventCard from "./RecommendedEventPreviewCard/RecommendedEventPreviewCard";
import RecommendedRoomCard from "../../../../components/RecommendedRoomCard/RecommendedRoomCard";

const RecommendedEvents = () => {
    const [eventsData, setEventsData] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roomLoading, setRoomLoading] = useState(true);
    
    // Use refs to track if requests have been initiated to prevent duplicate calls
    const eventsRequestInitiated = useRef(false);
    const roomRequestInitiated = useRef(false);
    
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    
    const events = Array.isArray(eventsData) ? eventsData : 
                   eventsData?.events ? eventsData.events : 
                   eventsData?.data ? eventsData.data : [];

    const recommendedRoom = roomData?.data || null;

    // Memoized fetch functions to prevent recreating on every render
    const fetchEvents = useCallback(async () => {
        if (eventsRequestInitiated.current) return; // Prevent duplicate calls
        eventsRequestInitiated.current = true;
        
        try {
            setLoading(true);
            const response = await axios({
                url: '/friends-events',
                method: 'GET',
                withCredentials: true,
            });
            setEventsData(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            addNotification({
                title: 'Error', 
                message: 'Error fetching events', 
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array since we don't want this to recreate

    const fetchRoomRecommendation = useCallback(async () => {
        if (roomRequestInitiated.current) return; // Prevent duplicate calls
        roomRequestInitiated.current = true;
        
        try {
            setRoomLoading(true);
            const response = await axios({
                url: '/get-recommendation',
                method: 'GET',
                withCredentials: true,
            });
            setRoomData(response.data);
        } catch (error) {
            console.error('Error fetching recommended room:', error);
            addNotification({
                title: 'Error', 
                message: 'Error fetching recommended room', 
                type: 'error'
            });
        } finally {
            setRoomLoading(false);
        }
    }, []); // Empty dependency array since we don't want this to recreate

    // Effect to trigger initial data fetching
    useEffect(() => {
        fetchEvents();
        fetchRoomRecommendation();
    }, [fetchEvents, fetchRoomRecommendation]);

  const exploreButton = (
    <div className="explore-events-button" onClick={() => navigate('/events-dashboard?page=0')}>
      Explore Events <Icon icon="mingcute:arrow-right-line" />
    </div>
  );

  return (
    <div className="recommended-events">
      <div className="content-row">
        <HeaderContainer
          icon="streamline:target-remix"
          header="Top Picks for You"
          right={exploreButton}
          size="16px"
          classN="recommended-events-container"
        >
          <div className="top-picks-content">
              {events && events.length > 0 ? (
                  events.map((event) => (
                      <EventCard key={event.id || event._id} event={event} />
                  ))
              ) : (
                  <div>No recommended events available</div>
              )}
          </div>
        </HeaderContainer>
        <div className="recommended-room"> 
          <div className="recommended-room-header">
            <p className="recommended-room-title">Recommended Room</p>
          </div>
          <RecommendedRoomCard room={recommendedRoom} />
        </div>
      </div>
    </div>
  );
};

export default RecommendedEvents;

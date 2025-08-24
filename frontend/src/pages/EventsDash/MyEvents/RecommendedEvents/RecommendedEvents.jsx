import React from "react";
import "./RecommendedEvents.scss";

import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import { useFetch } from "../../../../hooks/useFetch";
import { useNavigate } from "react-router-dom";


import HeaderContainer from "../../../../components/HeaderContainer/HeaderContainer";
import EventCard from "./RecommendedEventPreviewCard/RecommendedEventPreviewCard";

const RecommendedEvents = () => {
    // need to add more stuff to this algo, ensure control on how many we can fetch and add other ways to grab if no friend events are found
    const { data: eventsData, loading, error } = useFetch('/friends-events');
    const navigate = useNavigate();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const events = Array.isArray(eventsData) ? eventsData : 
                   eventsData?.events ? eventsData.events : 
                   eventsData?.data ? eventsData.data : [];


  const exploreButton = (
    <div className="explore-events-button" onClick={() => navigate('/events-dashboard?page=0')}>
      Explore Events <Icon icon="mingcute:arrow-right-line" />
    </div>
  );

  return (
    <div className="recommended-events">
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
    </div>
  );
};

export default RecommendedEvents;

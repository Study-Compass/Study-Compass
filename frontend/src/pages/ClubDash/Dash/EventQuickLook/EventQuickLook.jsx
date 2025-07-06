import HeaderContainer from "../../../../components/HeaderContainer/HeaderContainer";
import OIEEvent from "../../../OIEDash/OIEEventsComponents/Event/OIEEvent";
import PulseDot from "../../../../components/Interface/PulseDot/PulseDot";
import OIEEventSkeleton from "../../../OIEDash/OIEEventsComponents/Event/OIEEventSkeleton";
import { useState } from "react";
import { useFetch } from "../../../../hooks/useFetch";
import './EventQuickLook.scss';

const EventQuickLook = ({org}) => {
    const [selectedTab, setSelectedTab] = useState("upcoming");
    const upcomingEvents = useFetch(`/get-my-events?orgId=${org.org.overview._id}&type=future&sort=asc&limit=5`);


    return(
        <HeaderContainer icon="mingcute:calendar-fill" header="Quick Look" scroll={true} subheaderRow={
            <div className="row subheader">
                <div className={`column ${selectedTab === "upcoming" ? "selected" : ""}`}>
                    <p onClick={() => setSelectedTab("upcoming")}>Upcoming Events</p>
                </div>
                <div className={`column ${selectedTab === "pending" ? "selected" : ""}`}>
                    <p onClick={() => setSelectedTab("pending")}>Pending Submissions</p>
                </div>
            </div>}>
            <div className="row events-container">
                {
                    upcomingEvents.data && upcomingEvents.data.events.map((event) => (
                        <OIEEvent key={event._id} event={event} showOIE={event.approvalReference} manage={false} refetch={upcomingEvents.refetch} showHosting={true} showHostingType={false} extraInfo={
                            <div className="row live-event-info">
                                <div>
                                    <PulseDot color="var(--green)" size="8px" pulse={true} />
                                    <p className="live-event-info-text">Stats</p>
                                </div>
                                <div>
                                    <p className="time-until">In 12 hrs</p>
                                    <p className="rsvps">10 rsvps</p>
                                </div>
                            </div>
                        }/>
                    ))
                }
                { 
                    upcomingEvents.loading || upcomingEvents.data.events.length === 0 &&
                    <OIEEventSkeleton showHosting={true} extraInfo={
                        <div className="row live-event-info">
                            <div>
                                <PulseDot color="var(--green)" size="8px" pulse={true} />
                                <p className="live-event-info-text">Stats</p>
                            </div>
                        </div>
                    } />
                }
            </div>
        </HeaderContainer>
    )
}

export default EventQuickLook;



import React, { useEffect, useState } from "react";
import './MeetingManagement.scss';
import RedGrad from '../../../assets/Gradients/ClubAdminGrad.png';
import ClubEvent from "../ClubEventsComponents/Event/ClubEvent";
import EventMeeting from "../ClubEventsComponents/EventMeeting/EventMeeting";


function MeetingManagement({expandedClass,meetings, onExpand}){
    const [onGoing, setOnGoing] = useState(false);

    const [selectedMeeting, setSelectedMeeting] = useState(null);

    function handleExpand(selectedMeeting){
        onExpand();
        setSelectedMeeting(selectedMeeting);
    }

    function backToDash(){
        setSelectedMeeting(null);
        onExpand();
    }

    if(selectedMeeting){
        return <EventMeeting openDash={backToDash} />
    }


    return(
        <div className={`meetingmanagement ${expandedClass}`}>
            <img src={RedGrad} alt="" className="red-grad"/>
            <header className="header">
                <h1>Meeting Management</h1>
            </header>
            <div className="row">
                <div className="column">
                <h3>active meetings</h3>
                <div className="meeting">
                        {
                            meetings && meetings.events && meetings.events.length > 0 ? meetings.events.map((meeting, index) => {
                                console.log("HERE");
                                //check if meeting is upcoming or past
                                if(new Date(meeting.start_time) < new Date() && new Date() < new Date(meeting.end_time)){
                                    return <ClubEvent key={index} event={meeting}  onGoing = {true} onExpand={handleExpand}/>
                                }
                            }) : <h2>no meetings scheduled</h2>
                        }
                    </div>
                <h3>meetings coming up</h3>
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

export default MeetingManagement;
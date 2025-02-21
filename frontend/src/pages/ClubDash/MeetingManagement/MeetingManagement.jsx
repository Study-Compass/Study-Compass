import React from "react";
import './MeetingManagement.scss';
import RedGrad from '../../../assets/Gradients/ClubAdminGrad.png';
import ClubEvent from "../ClubEventsComponents/Event/ClubEvent";



function MeetingManagement(expandedClass,meetings){

    return(
        <div className={'meetingmanagement ${expandedClass}'}>
            <img src={RedGrad} alt="" className="red-grad"/>
            <header className="header">
                <h1>Meeting Management</h1>
            </header>
            <div className="row">
                <div className="column">
                <h2>active meetings</h2>
                <div className="meeting">
                        {
                            meetings && meetings.events && meetings.events.length > 0 ? meetings.events.map((meeting, index) => {
                                //check if meeting is upcoming or past
                                if(new Date(meeting.start_time) > new Date() || new Date(meeting.start_time) < new Date() || new Date(meeting.start_time) === new Date()){
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
import React from "react";
import "./HistoryEntry.scss";
import pfp from '../../../../assets/defaultAvatar.svg'

const HistoryEntry = ({historyEntry})  => {

    
    return(
        <div className = "historyentry">
            <div className="history-entry-left">
                <h3>{historyEntry.roomName}</h3>
                <img src={pfp} alt="" />
            </div>
            <div className="history-entry-right">
                <h4>{historyEntry.day}</h4>
                <h5>{historyEntry.time}</h5>
            </div>

        </div>
    );
}

export default HistoryEntry;
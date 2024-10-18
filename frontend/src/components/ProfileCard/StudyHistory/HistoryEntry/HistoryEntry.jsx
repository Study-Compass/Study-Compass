import React from "react";
import "./HistoryEntry.scss";
import pfp from '../../../../assets/defaultAvatar.svg'

const HistoryEntry = ({mockHistory})  => {

    
    return(
        <div className = "historyentry">
                <h3>{mockHistory.roomName}
                    <h6><img src={pfp} alt="" /></h6>
                </h3>
                <h4>{mockHistory.day}
                <h5>{mockHistory.time}</h5>
                </h4>
        </div>
    );
}

export default HistoryEntry;
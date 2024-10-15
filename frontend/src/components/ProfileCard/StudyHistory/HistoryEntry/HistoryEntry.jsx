import React from "react";
import "./HistoryEntry.scss";
import pfp from '../../../../assets/defaultAvatar.svg'

const HistoryEntry = ({})  => {

    return(
        <div className = "historyentry">
                <h3>russel sage laboratories 2715
                    <h6><img src={pfp} alt="" /></h6>
                </h3>
                <h4>Friday 10/8
                <h5>3:00 - 5:00</h5>
                </h4>
        </div>
    );
}

export default HistoryEntry;
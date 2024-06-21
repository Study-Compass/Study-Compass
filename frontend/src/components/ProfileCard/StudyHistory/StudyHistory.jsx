import React from 'react';
import './StudyHistory.css';
import History from "../../../assets/Icons/History.svg"
import DownArrow from "../../../assets/Icons/DownArrow.svg"

function StudyHistory(userInfo){
    return (
        <div className="box-header">
            <div className="title">
                <img src={History} alt="history-icon" />
                <p>study history</p>
                {/* <button className="collapsible-header" >
                    <img src={DownArrow} alt="downArrow-icon" />
                </button> */}
            </div>
        </div>
    )
}


export default StudyHistory;
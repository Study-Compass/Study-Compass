import React from 'react';
import './StudyHistory.css';
import History from "../../../assets/Icons/History.svg"

function StudyHistory(){
    return (
        <div className="box-header">
            <div className="title">
                <img src={History} alt="history-icon" />
                <p>study history</p>
            </div>
        </div>
    )
}


export default StudyHistory;
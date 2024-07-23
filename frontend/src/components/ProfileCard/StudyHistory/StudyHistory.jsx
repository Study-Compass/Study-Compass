import React, { useState } from 'react';
import './StudyHistory.css';
import History from "../../../assets/Icons/History.svg"
import DownArrow from "../../../assets/Icons/DownArrow.svg"






function StudyHistory({userInfo}){

    const [isOpen, setIsOpen] = useState(false);
  
    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`study-history ${isOpen ? 'open' : ''}`}>
            <div className="box-header">
                <div className="title">
                    <img src={History} alt="history-icon" />
                    <p>study history</p>
                    <button className={`collapsible-header ${isOpen ? 'open' : ''}`} onClick={toggleOpen} >
                        <img src={DownArrow} alt="downArrow-icon" />
                    </button>
                </div>
                <div className={`history-content ${isOpen ? 'open' : ''}`}>

                </div>
            </div>
        </div>
        
    )
}


export default StudyHistory;
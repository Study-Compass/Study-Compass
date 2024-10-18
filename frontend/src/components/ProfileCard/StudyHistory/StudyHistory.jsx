import React, { useState } from 'react';
import './StudyHistory.scss';
import History from "../../../assets/Icons/History.svg"
import DownArrow from "../../../assets/Icons/DownArrow.svg"
import HistoryEntry from './HistoryEntry/HistoryEntry';






function StudyHistory({userInfo}){

    const [isOpen, setIsOpen] = useState(false);
  
    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const mockHistory = [{
        roomName: "russel sage laboratories 2715", day: "Friday 10/8", time: "3:00 - 6:00"
    },
    {
        roomName: "russel sage laboratories 2716", day: "Friday 10/9", time: "3:00 - 6:00"
    },
    {
        roomName: "russel sage laboratories 2717", day: "Friday 10/10", time: "6:00 - 8:00"
    },
    {
        roomName: "russel sage laboratories 2718", day: "Friday 10/11", time: "3:00 - 5:00"
    },
    {
        roomName: "dcc 318", day: "Friday 10/12", time: "3:00 - 5:00"
    },
    {
        roomName: "dcc 308", day: "Friday 10/13", time: "3:00 - 6:00"
    },
    ]
    





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
                    <HistoryEntry mockHistory={mockHistory[0]}/>
                    <HistoryEntry mockHistory={mockHistory[1]}/>
                    <HistoryEntry mockHistory={mockHistory[2]}/>
                    <HistoryEntry mockHistory={mockHistory[3]}/>
                    <HistoryEntry mockHistory={mockHistory[4]}/>
                    <HistoryEntry mockHistory={mockHistory[5]}/>
                </div>
            </div>
        </div>
        
    )
}


export default StudyHistory;
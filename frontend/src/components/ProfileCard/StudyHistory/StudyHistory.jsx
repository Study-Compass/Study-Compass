import React, { useEffect, useState } from 'react';
import './StudyHistory.scss';
import History from "../../../assets/Icons/History.svg"
import DownArrow from "../../../assets/Icons/DownArrow.svg"
import HistoryEntry from './HistoryEntry/HistoryEntry';

import axios from 'axios';

function StudyHistory(){

    const [isOpen, setIsOpen] = useState(false);
    const [historyObjects, setHistoryObjects] = useState([]);
  
    const toggleOpen = () => {
        setIsOpen(!isOpen); 
    };
    
    useEffect(()=>{
        gethistory();
    },[]);
    
    const gethistory = async () => {
        try{
            const response = await axios.get('/get-history', {headers : {"Authorization" : `Bearer ${localStorage.getItem("token")}`}});
            console.log(response.data);
            setHistoryObjects(response.data.data);
        } catch(error){
            console.log(error);
        }
    }

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
                    {historyObjects.map((element, index)=>{
                         return <HistoryEntry historyEntry={element} key={`history-entry=${index}`}/>
                    })}
                </div>
            </div>
        </div>
        
    )
}


export default StudyHistory;
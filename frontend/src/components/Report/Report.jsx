import React, { useState, useRef }from 'react'
import './Report.css'
import logo from '../../assets/red_logo.svg';
import Loader from '../Loader/Loader';
import x from '../../assets/x.svg';


function Report(){
    const [isUp, setIsUp] = useState(true);

    const handleClose = () => {
        setIsUp(false);
      };

    return(
        <div className={`whole_page ${isUp ? 'in' : 'out'}`}>
            <div className={`pop_up ${isUp ? 'in' : 'out'}`}>
                <button className="close-button" onClick={handleClose}>
                    <img src={x} alt="close" />
                </button>
                <h1>Report Incorrect Information</h1>
                <p>Describe the incorrect information</p> 
                <button className="button">send</button>
            </div>
        </div>
    )
}

export default Report;
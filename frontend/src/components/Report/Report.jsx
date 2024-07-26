import React, { useState, useRef }from 'react'
import './Report.css'
import logo from '../../assets/red_logo.svg';
import Loader from '../Loader/Loader';
import x from '../../assets/x.svg';


function Report({text}){
    const [verified, setVerified] = useState(false);

    const [isUp, setIsUp] = useState(true);

    const handleClose = () => {
        setIsUp(false);
      };

    const [description, setDescription] = useState('');

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
    };

    return(
        <div className={`whole_page ${isUp ? 'in' : 'out'}`}>
            <div className={`pop_up ${isUp ? 'in' : 'out'}`}>
                <button className="close-button" onClick={handleClose}>
                    <img src={x} alt="close" />
                </button>
                <h1>Report Incorrect Information</h1>
                <div className="classroom-name">
                    <p>text</p> 
                </div>
                <p>Describe the incorrect information</p>
                <textarea 
                    value={description} 
                    onChange={handleDescriptionChange} 
                /> 
                <button className={`send-button ${verified ? 'alt' : ''}`}>send</button>
            </div>
        </div>
    )
}

export default Report;
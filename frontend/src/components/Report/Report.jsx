import React, { useState, useRef }from 'react'
import './Report.css'
import logo from '../../assets/red_logo.svg';
import Loader from '../Loader/Loader';
import x from '../../assets/x.svg';


function Report({text, isUp, setIsUp}){

    const handleClose = () => {
        setIsUp();
      };

    const [description, setDescription] = useState('');

    const [isValid, setIsValid] = useState(false);

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
        setIsValid(event.target.value.length >= 1 && event.target.value.length <= 250);
    };

    return(
        <div className={`whole_page ${isUp ? 'in' : 'out'}`}>
            <div className={`pop_up ${isUp ? 'in' : 'out'}`}>
                <button className="close-button" onClick={handleClose}>
                    <img src={x} alt="close" />
                </button>
                <h1>Report Incorrect Information</h1>
                <div className="classroom-name">
                    {text}
                </div>
                <p>Describe the incorrect information</p>
                <textarea 
                    value={description} 
                    onChange={handleDescriptionChange} 
                /> 
                <button className={`send-button ${isValid ? 'alt' : ''}`} onClick={setIsUp}>send</button>
            </div>
        </div>
    )
}

export default Report;
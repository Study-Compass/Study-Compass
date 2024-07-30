import React, { useState, useRef }from 'react'
import './Report.css';
import useOutsideClick from '../../hooks/useClickOutside';
import x from '../../assets/x.svg';


function Report({text, isUp, setIsUp}){

    const handleClose = () => {
        setIsUp();
    };

    const send = () => {
        setDescription('');
        setIsUp();
    }

    const ref = useRef();
    
    useOutsideClick(ref, () => {
        if (isUp){
            setIsUp();
        }
    });

    const [description, setDescription] = useState('');

    const [isValid, setIsValid] = useState(false);

    const handleDescriptionChange = (event) => {
        setDescription(event.target.value);
        setIsValid(event.target.value.length >= 1 && event.target.value.length <= 500);
    };

    return(
        <div className={`whole_page ${isUp ? 'in' : 'out'}`}>
            <div className={`pop_up ${isUp ? 'in' : 'out'}`} ref={ref}>
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
                <button className={`send-button ${isValid ? 'alt' : ''}`} onClick={send}>send</button>
            </div>
        </div>
    )
}

export default Report;
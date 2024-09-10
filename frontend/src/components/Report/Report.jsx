import React, { useState, useRef, useEffect }from 'react'
import './Report.css';
import useOutsideClick from '../../hooks/useClickOutside';
import x from '../../assets/x.svg';
import { sendError } from '../../DBInteractions';
import { useNotification } from '../../NotificationContext';


function Report({text, isUp, setIsUp}){

    const { addNotification } = useNotification();

    const handleClose = () => {
        setIsUp();
    };

    const [visible, setVisible] = useState(false);

    const send = async () => {  
        try{
            await sendError(description, text);
            setDescription('');
            setIsUp();
        } catch (error){
            console.error(error);
            setDescription('');
            setIsUp();
            addNotification({title: "Error", message: "Failed to send report", type: "error"});
        }
    }

    useEffect(()=>{
        if(isUp){
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [isUp])

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
        (isUp &&
        <div className={`whole_page ${visible ? 'in' : 'out'}`}>
            <div className={`pop_up ${visible ? 'in' : 'out'}`} ref={ref}>
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
    )
}

export default Report;
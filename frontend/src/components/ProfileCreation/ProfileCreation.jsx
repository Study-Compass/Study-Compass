import React, { useState, useRef }from 'react'
import './ProfileCreation.css'
import logo from '../../assets/red_logo.svg';
import Loader from '../Loader/Loader';
import x from '../../assets/x.svg';


function ProfileCreation(){
    const [isUp, setIsUp] = useState(true);

    const handleClose = () => {
        setIsUp(false);
      };

    return(
        <div className={`whole_page ${isUp ? 'in' : 'out'}`}>
            <div className={`pop_up ${isUp ? 'in' : 'out'}`}>
                <div className="left_benifits"></div>
                <Loader/>
                <button className="close-button" onClick={handleClose}>
                    <img src={x} alt="close" />
                </button>
                <h1>Create an Account</h1>
                <p>You'll need an account to do this. Please log in or create an account.</p> 
                <button className="button">log in</button>
                <button className="button">register</button>
            </div>
        </div>
    )
}

export default ProfileCreation;
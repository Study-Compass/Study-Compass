import React, { useState, useRef }from 'react'
import './ProfileCreation.css'


function ProfileCreation(){
    return(
        <div className="whole_page">
            <div className="pop_up">
                <button className="close-button" >X</button>
                <h1>Create an Account</h1>
                <p>You'll need an account to do this. Please log in or create an account.</p> 
            </div>
        </div>
        
    )
}

export default ProfileCreation;
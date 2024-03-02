import React from 'react';
import logo from '../../assets/compass.svg'
import './Loader.css'

function Loader(){
    return(
        <div className={`loader`}>
            <img src={logo} alt="compass"></img>
        </div>
    );
}

export default Loader
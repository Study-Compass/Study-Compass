import React from 'react'
import logo from '../../assets/red_logo.svg';
import './Header.css';

function Header(){
    return(
        <div className="Header">
            <img className="logo" src={logo} alt="logo" />
            {/* <h1>roomie</h1> */}
        </div>
    );
}

export default Header
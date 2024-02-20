import React from 'react'
import logo from '../../assets/red_logo.svg';
import './Header.css';
import ProfilePicture from '../ProfilePicture/ProfilePicture';


function Header(){
    return(
        <div className="Header">
            <img className="logo" src={logo} alt="logo" />
            <div className="header-right">
                <ProfilePicture/>
            </div>
        </div>
    );
}

export default Header
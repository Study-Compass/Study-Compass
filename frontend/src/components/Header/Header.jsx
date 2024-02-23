import React from 'react'
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/red_logo.svg';
import './Header.css';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import useAuth from '../../hooks/useAuth';

function Header(){
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const goToLogin = ()=>{
        navigate('/register',{replace : true});

    }
    user ? console.log(user) : console.log("no user");
    return(
        <div className="Header">
            <img className="logo" src={logo} alt="logo" />
            <div className="header-right">
                {isAuthenticated ? <ProfilePicture/> : ""}
                {!isAuthenticated ? <button onClick={goToLogin}>login</button> : ""}
            </div>
        </div>
    );
}

export default Header
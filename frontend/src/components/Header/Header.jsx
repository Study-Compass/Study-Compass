import React,{ useState } from 'react'
import { useNavigate,useLocation } from 'react-router-dom';
import logo from '../../assets/red_logo.svg';
import './Header.css';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import useAuth from '../../hooks/useAuth';

function Header(){
    const { isAuthenticated, logout, user } = useAuth();
    const [page, setPage] = useState(useLocation().pathname);
    const navigate = useNavigate();

    const goToLogin = ()=>{
        navigate('/login',{replace : true});

    }

    return(
        <div className="Header">
            <img className="logo" src={logo} alt="logo" />
            {page === "/login" || page === "/register" ? "" :
                <div className="header-right">
                    {isAuthenticated ? <ProfilePicture/> : ""}
                    {!isAuthenticated ? <button onClick={goToLogin}>login</button> : ""}
                </div>    
            }
        </div>
    );
}

export default Header
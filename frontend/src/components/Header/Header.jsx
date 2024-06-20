import React,{ useEffect, useState, useRef } from 'react'
import { useNavigate,useLocation, Link } from 'react-router-dom';
import logo from '../../assets/red_logo.svg';
import './Header.css';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import useAuth from '../../hooks/useAuth';

const Header = React.memo(()=>{
    const { isAuthenticated, logout, user } = useAuth();
    const [page, setPage] = useState(useLocation().pathname);
    const [pageClass, setPageClass] = useState(null);
    const navigate = useNavigate();

    const goToLogin = ()=>{
        navigate('/login',{replace : true});
    }

    useEffect(()=>{
        if(page.includes("/room")){
            setTimeout(() => {             
                setPageClass("room");
            }, 100);
        } else if(page.includes("/friends")){
            setTimeout(() => {
                setPageClass("friends");
            }, 100);
        }
    },[page]);

    return(
        <div className="Header">
            <div className="nav-container">
                {page === "/login" || page === "/register" ? "" :
                    <nav>
                        <Link className={`nav-link ${ pageClass === "room" ? "active" : ""}`} to="/room/none" ><h2>search</h2></Link>
                        <Link className={`nav-link ${ pageClass === "friends" ? "active" : ""}`} to="/friends" ><h2>friends</h2></Link>
                    </nav>  
                }
            </div>
            <img className="logo" src={logo} alt="logo" />
            {page === "/login" || page === "/register" ? "" :
                <div className="header-right">
                    {isAuthenticated ? <ProfilePicture/> : ""}
                    {!isAuthenticated ? <button onClick={goToLogin}>login</button> : ""}
                </div>    
            }
        </div>
    );
});

export default Header
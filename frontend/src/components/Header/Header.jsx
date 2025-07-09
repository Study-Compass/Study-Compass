import React,{ useEffect, useState, useRef } from 'react'
import { useNavigate,useLocation, Link } from 'react-router-dom';
import logo from '../../assets/Brand Image/Logo.svg';
import './Header.scss';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import useAuth from '../../hooks/useAuth';
import MobileLogo from '../../assets/MobileLogo.svg';
import { useWebSocket } from '../../WebSocketContext';
import RpiLogo from '../../assets/Brand Image/RpiLogo.svg';
import BerkeleyLogo from '../../assets/Brand Image/BerkeleyLogo.svg';

function getLogo() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    if (parts.length > 2) {
        let subdomain = parts[0];
        if (subdomain.toLowerCase() === 'www') {
            subdomain = parts[1]; 
        }
        if (subdomain.toLowerCase() === 'rpi') {
            return RpiLogo;
        } else if (subdomain.toLowerCase() === 'berkeley') {
            return BerkeleyLogo;
        }
    }
    return logo; 
}


const Header = React.memo(()=>{
    const { isAuthenticating, isAuthenticated, logout, user, checkedIn } = useAuth();
    const [page, setPage] = useState(useLocation().pathname);
    const [pageClass, setPageClass] = useState(null);
    const navigate = useNavigate();
    const [checkedInClassroom, setCheckedInClassroom] = useState(null);

    const [width, setWidth] = useState(window.innerWidth);

    const goToLogin = ()=>{
        navigate('/login',{replace : true});
    }

    const goHome = ()=>{
        if(!page.includes("/room")){
            navigate('/room/none',{replace : true});
        }
    }

    useEffect(()=>{
        if(checkedIn){
            setCheckedInClassroom(checkedIn.classroom);
        }
    },[checkedIn]);

    useEffect(()=>{
        if(page.includes("/room")){
            setTimeout(() => {             
                setPageClass("room");
            }, 100);
        } else if(page.includes("/friends")){
            setTimeout(() => {
                setPageClass("friends");
            }, 100);
        } else if(page.includes("/events")){
            setTimeout(() => {
                setPageClass("events");
            }, 100);
        }
    },[page]);

    useEffect(() => { //useEffect for window resizing
        function handleResize() {
          setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
    
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    return(
        <div className="Header">
            <div className="header-content">
                {page === "/login" || page === "/register"  || page === "/"  ? "" :
                    <div className="nav-container">
                        <nav>
                            {isAuthenticated && <Link className={`nav-link ${ pageClass === "room" ? "active" : ""}`} to="/room/none" ><h2>search</h2></Link>}
                            {isAuthenticated && <Link className={`nav-link ${ pageClass === "friends" ? "active" : ""}`} to="/friends" ><h2>friends</h2></Link>}
                            <Link className={`nav-link ${ pageClass === "events" ? "active" : ""}`} to="/events-dashboard" ><h2>events</h2></Link>                         
                        </nav>  
                    </div>
                    
                }
                {
                    isAuthenticated ? 

                    <Link to='/room/none'>
                        <img className="logo" src={ isAuthenticated || isAuthenticating ? width < 800 ? MobileLogo : getLogo() : getLogo()} alt="logo"/>
                    </Link>
                    :
                    <Link to='/'>
                    <img className="logo" src={ isAuthenticated || isAuthenticating ? width < 800 ? MobileLogo : getLogo() : getLogo()} alt="logo"/>
                    </Link>
                }

                {page === "/login" || page === "/register" ? "" :
                    <div className="header-right">
                        {isAuthenticated ? <ProfilePicture/> : ""}
                        {!isAuthenticated ? <button onClick={goToLogin}>login</button> : ""}
                    </div>    
                }
            </div>
        </div>
    );
});

export default Header;
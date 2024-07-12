import React, { createContext, useContext, useState, useRef }from 'react'
import './ProfileCreation.css'
import logo from './assets/red_logo.svg';
import Loader from './components/Loader/Loader';
import x from './assets/x.svg';
import useOutsideClick from './hooks/useClickOutside';
import {Link, useNavigate} from 'react-router-dom'


const ProfileCreationContext = createContext();

export const useProfileCreation = () => useContext(ProfileCreationContext);

export const ProfileCreationProvider = ({ children }) => {
    const [isUp, setIsUp] = useState(false);
    const navigate = useNavigate();

    const handleClose = () => {
        setIsUp(false);
    };

    const handleOpen = () => {
        setIsUp(true);
    };

    const ref = useRef();
    
    useOutsideClick(ref, () => {
        setIsUp(false);
    });

    const goToLogin = ()=>{
        handleClose();
        navigate('/login');
    }

    const goToRegister = ()=>{
        handleClose();
        navigate('/register');
    }

    return(
        <ProfileCreationContext.Provider value={{handleOpen}}>
            {children}
            <div className={`whole-page ${isUp ? 'in' : 'out'}`}>
                <div className={`pop-up ${isUp ? 'in' : 'out'}`} ref={ref}>
                    <div className="left-benefits"></div>
                    <Loader/>
                    <button className="close-button" onClick={handleClose}>
                        <img src={x} alt="close" />
                    </button>
                    <h1>Create an Account</h1>
                    <p>You'll need an account to do this. Please log in or create an account.</p> 
                    <button className="button" onClick={goToLogin}>log in</button>
                    <button className="button" onClick={goToRegister}>register</button>
                </div>
            </div>
        </ProfileCreationContext.Provider>
    )
}
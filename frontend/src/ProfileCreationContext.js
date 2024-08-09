import React, { createContext, useContext, useState, useRef }from 'react'
import './ProfileCreation.css'
import Loader from './components/Loader/Loader';
import x from './assets/x.svg';
import useOutsideClick from './hooks/useClickOutside';
import {useNavigate} from 'react-router-dom'


const ProfileCreationContext = createContext();

export const useProfileCreation = () => useContext(ProfileCreationContext);

export const ProfileCreationProvider = ({ children }) => {
    const [isCreationUp, setCreationIsUp] = useState(false);
    const navigate = useNavigate();

    const handleClose = () => {
        setCreationIsUp(false);
    };

    const handleOpen = () => {
        setCreationIsUp(true);
    };

    const ref = useRef();
    
    useOutsideClick(ref, () => {
        setCreationIsUp(false);
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
            {isCreationUp && (
            <div className={`whole-page ${isCreationUp ? 'in' : 'out'}`}>
                <div className={`pop-up ${isCreationUp ? 'in' : 'out'}`} ref={ref}>
                    <div className="left-benefits">

                    </div>
                    <div className="right-benefits">
                        <div className="loader">
                            <Loader/>
                        </div>
                        {isCreationUp && (
                            <button className="close-button" onClick={handleClose}>
                                <img src={x} alt="close" />
                            </button>
                        )}
                        <h1>Create an Account</h1>
                        <p>You'll need an account to do this. Please log in or create an account.</p> 
                        {isCreationUp && (
                            <button className="button" onClick={goToLogin}>log in</button>
                        )}
                        {isCreationUp && (
                            <button className="button" onClick={goToRegister}>register</button>
                        )}
                    </div>
                </div>
            </div>
            )}
        </ProfileCreationContext.Provider>
    )
}
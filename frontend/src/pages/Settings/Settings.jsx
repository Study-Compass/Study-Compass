import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import AccountSettings from '../../components/AcccountSettings/AccountSettings.jsx';
import './Settings.css';
import pfp from '../../assets/defaultAvatar.svg';
import preferences from '../../assets/Icons/Preferences.svg';
import rightarrow from '../../assets/Icons/RightArrow.svg';
import useAuth from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';

function Settings() {
    const [width, setWidth] = useState(window.innerWidth);
    const [settingsRightSide, setSettingsRightSide] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    const { isAuthenticating, isAuthenticated, user } = useAuth();

    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticating) {
            return;
        }
        if (!isAuthenticated) {
            navigate("/login");
        }
        if (!user) {
            return;
        } else {
            setUserInfo(user);
            console.log(user);
        }
    }, [isAuthenticating, isAuthenticated, user])

    useEffect(() => { //useEffect for window resizing
        function handleResize() {
            setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (width > 700) {
            setSettingsRightSide(false);
        }
    }, [width]);

    const handleArrowClick = () => {
        setSettingsRightSide(true);
    };

    const handleBackClick = () => {
        setSettingsRightSide(false);
    };

    if(!userInfo){
        return(
            <div className="settings">
                <Header/>
            </div>
        );
    }

    return (
        <div className='settings'>
            <Header />
            <div className='content-container'>
                <div className='settings-container'>

                    <div className='settings-left'>
                        <div className='header'>
                            <img src={userInfo.picture ? userInfo.picture : pfp} alt="" />
                            <div className='name'>
                                <h1>{userInfo.username}</h1>
                                <p>{userInfo.email}</p>
                            </div>
                            {width <= 700 && (
                                <button className='right-arrow' onClick={handleArrowClick} >
                                    <img src={rightarrow} alt="" />
                                </button>
                            )}

                        </div>
                        <div className='preferences'>
                            <img src={preferences} alt="" />
                            <p>Study Preferences</p>
                            {width <= 700 && (
                                <button className='right-arrow' onClick={handleArrowClick} >
                                    <img src={rightarrow} alt="" />
                                </button>
                            )}

                        </div>
                    </div>
                    <AccountSettings settingsRightSide={settingsRightSide} 
                        width={width} 
                        handleBackClick={handleArrowClick}
                        userInfo={userInfo}
                    />


                    




                </div>
            </div>
            <div>

            </div>
        </div>
    );
}

export default Settings;
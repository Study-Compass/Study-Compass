import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import AccountSettings from '../../components/AcccountSettings/AccountSettings.jsx';
import StudyPreferences from '../../components/StudyPreferences/StudyPreferences.jsx';
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
    const [currentPage, setCurrentPage] = useState('Settings');

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

    useEffect(() => { 
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

    const handleArrowClick = (page) => {
        setCurrentPage(page);
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
                        <div className='header'  onClick={()=>{handleArrowClick('AccountSettings')}}>
                            <img src={userInfo.picture ? userInfo.picture : pfp} alt="" />
                            <div className='name'>
                                <h1>{userInfo.username}</h1>
                                <p>{userInfo.email}</p>
                            </div>
                            {width <= 700 && (
                                <button className='right-arrow'  >
                                    <img src={rightarrow} alt="" />
                                </button>
                            )}

                        </div>
                        <div className='preferences'  onClick={()=>{handleArrowClick('StudyPreferences')}}>
                            <img src={preferences} alt="" />
                            <p>Study Preferences</p>
                            {width <= 700 && (
                                <button className='right-arrow' >
                                    <img src={rightarrow} alt="" />
                                </button>
                            )}

                        </div>
                    </div>                        
                    <AccountSettings 
                        settingsRightSide={currentPage === "AccountSettings" ?  settingsRightSide : false} 
                        width={width} 
                        handleBackClick={handleBackClick}
                        userInfo={userInfo}
                    />
                    <StudyPreferences
                    settingsRightSide={currentPage === "StudyPreferences" ?  settingsRightSide : false}
                        userInfo={userInfo}
                        handleBackClick={handleBackClick}
                        width={width} 
                    />
                </div>
            </div>
            <div>

            </div>
        </div>
    );
}

export default Settings;
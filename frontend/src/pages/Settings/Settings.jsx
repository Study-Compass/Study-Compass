import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import AccountSettings from '../../components/AcccountSettings/AccountSettings.jsx';
import StudyPreferences from '../../components/StudyPreferences/StudyPreferences.jsx';
import './Settings.scss';
import pfp from '../../assets/defaultAvatar.svg';
import preferences from '../../assets/Icons/Preferences.svg';
import rightarrow from '../../assets/Icons/RightArrow.svg';
import display from '../../assets/Icons/DisplaySettings.svg'
import useAuth from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';

function Settings() {
    const [width, setWidth] = useState(window.innerWidth);
    const [settingsRightSide, setSettingsRightSide] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [currentPage, setCurrentPage] = useState('Settings');
    const [isDeveloper, setIsDeveloper] = useState(null);

    const { isAuthenticating, isAuthenticated, user, getDeveloper } = useAuth();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticating, isAuthenticated, user])

    useEffect(() => { 
        function handleResize() {
            setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const getDeveloperStatus = async () => {
            const response = await getDeveloper();
            if (response.developer){
                setIsDeveloper(true);
            } else {
                setIsDeveloper(false);
            }
        }
        
        if (userInfo) {
            if (userInfo.developer !== 0) {
                getDeveloperStatus();
            }
        }
    }, [userInfo]);

    useEffect(() => {
        if (width > 700) {
            setSettingsRightSide(false);
            setCurrentPage('AccountSettings');
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
        <div className='settings component'>
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
                        <div className={`preferences ${currentPage === "StudyPreferences" && 'selected'}`}  onClick={()=>{handleArrowClick('StudyPreferences')}}>
                            <img src={preferences} alt="" />
                            <p>Study Preferences</p>
                            {width <= 700 && (
                                <button className='right-arrow' >
                                    <img src={rightarrow} alt="" />
                                </button>
                            )}
                        </div>       
                        <div className={`preferences ${currentPage === "DisplaySettings" && 'selected'}`} onClick={()=>{handleArrowClick('DisplaySettings')}}>
                            <img src={display} alt="" />
                            <p>Display Settings</p>
                            {width <= 700 && (
                                <button className='right-arrow' >
                                    <img src={rightarrow} alt="" />
                                </button>
                            )}
                        </div>
                        
                        {
                            isDeveloper !== null && !isDeveloper && (
                                <button className='developer' onClick={()=>{navigate('/developer-onboarding')}}>
                                    Activate Developer Account
                                </button>
                            )
                        }

                    </div>     


                    {
                        (width < 700 || currentPage === "AccountSettings" ) && (
                            <AccountSettings 
                                settingsRightSide={currentPage === "AccountSettings" ?  settingsRightSide : false} 
                                width={width} 
                                handleBackClick={handleBackClick}
                                userInfo={userInfo}
                            />
                        )
                    }            
                    {
                        (width < 700 || currentPage === "StudyPreferences" ) && (
                            <StudyPreferences
                                settingsRightSide={currentPage === "StudyPreferences" ?  settingsRightSide : false}
                                userInfo={userInfo}
                                handleBackClick={handleBackClick}
                                width={width}
                            />
                        )
                    }
                    {
                        (width < 700 || currentPage === "DisplaySettings" ) && (
                            <DisplaySettings
                                settingsRightSide={currentPage === "DisplaySettings" ?  settingsRightSide : false}
                                userInfo={userInfo}
                                handleBackClick={handleBackClick}
                                width={width}
                            />
                        )
                    }

                </div>
            </div>
            <div>

            </div>
        </div>
    );
}

export default Settings;
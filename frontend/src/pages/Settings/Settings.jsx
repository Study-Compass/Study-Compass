import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import './Settings.css';
import pfp from '../../assets/defaultAvatar.svg';
import preferences from '../../assets/Icons/Preferences.svg';
import rightarrow from '../../assets/Icons/RightArrow.svg';

function Settings(){
    const [width, setWidth] = useState(window.innerWidth);
    const [settingsRightSide, setSettingsRightSide] = useState(false);

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

    


    return(
        <div className='settings'>
            <Header />
            <div className='content-container'>
                <div className='settings-container'>
                       
                        <div className='settings-left'>
                            <div className='header'>
                                <img src={pfp} alt="" />
                                <div className='name'>
                                    <h1>James Liu</h1>
                                    <p>email</p>
                                </div>
                                {width <= 700 &&(
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


                {/* {(width > 700 || settingsRightSide) && ( */}

                    <div className={`settings-right ${settingsRightSide ? "active" : "not-active"}`}>
                        <div className='header'>
                            <h1>Account Settings</h1>
                            {width <= 700 && settingsRightSide && (
                                <button className='back-arrow' onClick={handleBackClick}>
                                <img src={rightarrow} alt="Back Arrow" style={{ transform: 'rotate(180deg)' }} />
                                </button>
                            )}
                        </div>
                       
                        <div className='profile'>
                            
                            <h2>profile settings</h2>
                            <hr />
                            
                            <div className='name-settings'>
                                <img src={pfp} alt="" />
                                

                                <div className='input-name'>
                                    <h3>name:</h3>
                                    <input type="James Liu" />
                                </div>

                            </div>
                           
                            <h2>security settings</h2>
                            <hr />
                            <div className='user-container'>
                                <div className='user'>
                                    <h3>username</h3>
                                    <p>@isekouyo</p>
                                </div>
                                    <button>change usename</button>
                    
                            </div>
                            <div className='user-container'>
                                <div className='email'>
                                    <h3>email</h3>
                                    <p>jbliu88@gmail.com</p>
                                </div> 
                                <button>change email</button>

                            </div>
                            <div className='user-container'>
                                <div className='password'>
                                    <h3>password</h3>
                                    <p>enabled</p>
                                </div>
                                <button>change password</button>

                            </div>

                            <h2>danger zone</h2>
                            <hr />
                            <div className='user-container'>
                                <div className='delete'>
                                    <button>
                                        <h3>delete account</h3>
                                        
                                        </button>
                                    <p>warning: this is a permanent action !</p>

                                </div>
                            </div>
                            
                            

                        </div>
                        <div className='security'>
                            
                        </div>

                        <div className='danger'>
                            
                        </div>

                    </div>
                    
                {/* )} */}



                </div>
            </div>
        <div>
            
            </div>
        </div>
    );
}

export default Settings;
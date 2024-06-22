import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import './Settings.css';
import pfp from '../../assets/defaultAvatar.svg';

function Settings(){

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
                        </div>
                        <div className='preferences'>
                            <p>Study Preferences</p>
                        </div>
                    </div>

                    <div className='settings-right'>
                        <div className='header'>
                            <h1>Account Settings</h1>
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
                            <button>delete account</button>
                            

                        </div>
                        <div className='security'>
                            
                        </div>

                        <div className='danger'>
                            
                        </div>

                    </div>
                </div>
            </div>
        <div>
            
            </div>
        </div>
    );
}

export default Settings;
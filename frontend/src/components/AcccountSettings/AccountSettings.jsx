import React, { useEffect, useState } from 'react';
import './AccountSettings.css';
import rightarrow from '../../assets/Icons/RightArrow.svg';
import pfp from '../../assets/defaultAvatar.svg';

function AccountSettings({ settingsRightSide, width, handleBackClick, userInfo }) {

    return (
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
                    <img src={userInfo.picture ? userInfo.picture : pfp} alt="" />


                    <div className='input-name'>
                        <h3>name:</h3>
                        <input type="James Liu" />
                    </div>

                </div>

                <h2>security settings</h2>
                <hr />
                <div className="settings-rows-container">
                    <div className='user-container'>
                        <div className='user'>
                            <h3>{userInfo.username}</h3>
                            <p>@id</p>
                        </div>
                        <button>change usename</button>

                    </div>
                    <div className='user-container'>
                        <div className='email'>
                            <h3>email</h3>
                            <p>{userInfo.email}</p>
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
                </div>

                <h2>danger zone</h2>
                <hr />
                <div className="settings-rows-container">
                    <div className='user-container'>
                        <div className='delete'>
                            <button>
                                <h3>delete account</h3>

                            </button>
                            <p>warning: this is a permanent action !</p>

                        </div>
                    </div>
                </div>

            </div>
            <div className='security'>

            </div>

            <div className='danger'>

            </div>

        </div>
    )

}

export default AccountSettings;
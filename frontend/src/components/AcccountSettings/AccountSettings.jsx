import React, { useEffect, useState } from 'react';
import './AccountSettings.css';
import rightarrow from '../../assets/Icons/RightArrow.svg';
import pfp from '../../assets/defaultAvatar.svg';
import { saveUser } from '../../DBInteractions';
import { useNotification } from '../../NotificationContext';

function AccountSettings({ settingsRightSide, width, handleBackClick, userInfo }) {

    // const [active, setActive] = useState(false);

    // const [changeUsername, setChangeUsername] = 
    const [name, setName] = useState(userInfo.name);
    const [username, setUsername] = useState(userInfo.username);
    const [editUsername, setEditUsername] = useState(false);

    
    const [editEmail, setEditEmail] = useState(false);
    const [email, setEmail] = useState(userInfo.email);

    // useEffect(() => {


    // } );

    const handleNameChange = (e) => {
            // setName(e.target.value);
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const saveUsername = () => {
        if (editUsername){
            saveUser(name, username, email, null, null, null);
        }
        setEditUsername(!editUsername);

        // setEditUsername(false);
        // setEditEmail(false);
    };

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
                        <input type="text" value={name} onChange={handleNameChange}/>
                    </div>

                </div>

                <h2>security settings</h2>
                <hr />
                <div className="settings-rows-container">
                    <div className='user-container'>
                        <div className='user'>
                        {editUsername ? (
                                <input type="text" value={username} onChange={handleUsernameChange}
                                    // onBlur={saveUsername}
                                    // autoFocus
                                /> ): 
                                (
                                <>
                                    <h3>username</h3>
                                    <p>@{username}</p>
                                </>
                                )
                        }
                        
                        </div>
                        {/* <button onClick={(saveUsername) => setEditUsername(true)}>change username</button> */}
                        
                        <button onClick={(saveUsername)}> {editUsername ? 'save' : 'change username'} </button>

                    </div>
                    <div className='user-container'>
                        <div className='email'>
                        {editEmail ? (
                                <input
                                    type="text" value={email} onChange={handleEmailChange}
                                    onBlur={saveUsername}
                                    autoFocus
                                /> ): 
                                (
                                <>
                                    <h3>email</h3>
                                    <p>{userInfo.email}</p>
                                </>
                                )  
                        }
                        </div>
                        <button onClick={() => setEditEmail(true)}>change email</button>

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
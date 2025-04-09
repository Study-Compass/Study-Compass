import React, { useEffect, useState, useCallback } from 'react';
import './AccountSettings.scss';
import rightarrow from '../../assets/Icons/RightArrow.svg';
import pfp from '../../assets/defaultAvatar.svg';
import { saveUser, checkUsername } from '../../DBInteractions';
import { useNotification } from '../../NotificationContext';
import { debounce} from '../../Query.js';
import check from '../../assets/Icons/Check.svg';
import waiting from '../../assets/Icons/Waiting.svg';
import error from '../../assets/circle-warning.svg';
import unavailable from '../../assets/Icons/Circle-X.svg';
import useAuth from '../../hooks/useAuth.js';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import ImageUpload from '../ImageUpload/ImageUpload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import postRequest from '../../utils/postRequest.js';

function AccountSettings({ settingsRightSide, width, handleBackClick, userInfo }) {

    const { validateToken } = useAuth();
    const navigate = useNavigate();
    // const [active, setActive] = useState(false);

    // const [changeUsername, setChangeUsername] = 
    const [name, setName] = useState(userInfo.name);
    const [username, setUsername] = useState(userInfo.username);
    const [editUsername, setEditUsername] = useState(false);
    const [editName, setEditName] = useState(false);
    const [editEmail, setEditEmail] = useState(false);

    const [usernameValid, setUsernameValid] = useState(1);
    const { addNotification } = useNotification();
    const [initialUsername, setInitialUsername] = useState(userInfo.username);
    const [intialName, setInitialName] = useState(userInfo.name);

    const [uploadPfp, setUploadPfp] = useState(false);
    const [profilePicture, setProfilePicture] = useState(userInfo.picture);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    
    const [email, setEmail] = useState(userInfo.email);
    
    const handleFileSelect = (file) => {
        setSelectedFile(file);
    };

    const handleProfilePictureUpload = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post('/upload-user-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                setProfilePicture(response.data.imageUrl);
                setUploadPfp(false);
                validateToken();
                addNotification({title: 'Profile Picture Updated', message: 'Your profile picture has been updated successfully', type: 'success'});
            } else {
                addNotification({title: 'Upload Failed', message: response.data.message || 'Failed to upload profile picture', type: 'error'});
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            addNotification({title: 'Upload Error', message: error.response?.data?.message || 'Error uploading profile picture', type: 'error'});
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };

    const handleFileClear = () => {
        setSelectedFile(null);
        setUploadPfp(false);
    };

    const validUsername = async (username) => {
        if (username === null || username === "") {
            return;
        }
        if (username === initialUsername) {
            setUsernameValid(1);
            return;
        }
        setUsernameValid(0);
        try{
            const response = await checkUsername(username);
            if(response){
                setUsernameValid(1);
            } else {
                setUsernameValid(2);
            }
        } catch (error){
            addNotification({title: 'Error checking username', message: error.message, type: 'error'});
        }
    };

    const debounced = useCallback(debounce(validUsername, 500),[]);


    useEffect(() => {
        if (username === null || username === "") {
            setUsernameValid(3);
            return;
        }
        if (username === initialUsername) {
            setUsernameValid(1);
            return;
        }
        setUsernameValid(0);
        debounced(username);
    }, [username]);


    const handleNameChange = (e) => {
            setName(e.target.value);
    };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const saveUsername = () => {
        if (editUsername){
            try{
                saveUser(null, username, null, null, null, null);
                setInitialUsername(username);
                addNotification({title: 'Username saved', message: 'Your username has been changed successfully', type: 'success'});
            } catch (error) {
                addNotification({title: 'Error saving user', message: error.message, type: 'error'});
            }
        }
        setEditUsername(!editUsername);
    };

    const saveName = () => {
        try{
            saveUser(name, null, null, null, null, null);
            setInitialName(name);
            setEditName(false);
            addNotification({title: 'Name saved', message: 'Your name has been changed successfully', type: 'success'});
        } catch (error) {
            addNotification({title: 'Error saving user', message: error.message, type: 'error'});
        }
    };

    const saveEmail = () => {
        try{
            saveUser(null, null, email, null, null, null);
            setEditEmail(false);
            addNotification({title: 'Email saved', message: 'Your email has been changed successfully', type: 'success'});
        } catch (error) {
            addNotification({title: 'Error saving user', message: error.message, type: 'error'});
        }
    };

    const deleteAccount = () => {
        addNotification({title: 'Interanl Error', message: 'an internal error occurred', type: 'error'});
    };
    
    const unlinkSchoolEmail = async () => {
        try {
            // Call API to unlink school email
            const response = await postRequest('/unlink-school-email');
            
            if (response.success) {
                addNotification({title: 'School Email Unlinked', message: 'Your school email has been successfully unlinked', type: 'success'});
                // Refresh user data or update state
                validateToken();
            } else {
                addNotification({title: 'Unlink Failed', message: response.message || 'Failed to unlink school email', type: 'error'});
            }
        } catch (error) {
            console.error('Error unlinking school email:', error);
            addNotification({title: 'Unlink Error', message: error.message || 'Error unlinking school email', type: 'error'});
        }
    };

    const uploadPfpToggle = () => {
        setUploadPfp(!uploadPfp);
    }

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

                <h2>Profile Settings</h2>
                <div className='name-settings'>
                    <div className="picture-container">
                        <img className="pfp" src={profilePicture ? profilePicture : pfp} alt="" />
                        <div className="add-picture" onClick={uploadPfpToggle}>
                            <Icon icon="mdi:image-add"/>
                        </div>
                    </div>
                    <div className={`pfp-upload ${uploadPfp && "active"}`}>
                    <ImageUpload 
                        uploadText="Upload new profile picture" 
                        onFileSelect={handleFileSelect}
                        onUpload={handleProfilePictureUpload}
                        onFileClear={handleFileClear}
                        isUploading={isUploading}
                        uploadMessage="Maximum size: 5MB"
                    />
                </div>
                    <div className='user-container'>
                        <div className='email'>
                            {editName ? (
                                <input type="text" value={name} onChange={handleNameChange} autoFocus />
                            ) : (
                                <>
                                    <h3>Name</h3>
                                    <p>{name}</p>
                                </>
                            )}
                        </div>
                        <button onClick={() => {
                            if (editName) {
                                saveName();
                            } else {
                                setEditName(true);
                            }
                        }}>
                            {editName ? 'save' : 'change name'}
                        </button>
                    </div>
                    <div className='user-container'>
                        <div className='user'>
                        {editUsername ? (
                                <>  
                                    <input type="text" value={username} onChange={handleUsernameChange}
                                        // onBlur={saveUsername}
                                        // autoFocus
                                    />
                                        <div className="status">
                                            { usernameValid === 0 && <div className="checking"><img src={waiting} alt="" /><p>checking username...</p></div>}
                                            { usernameValid === 1 && <div className="available"><img src={check} alt="" /><p>username is available</p></div>}
                                            { usernameValid === 2 && <div className="taken"><img src={unavailable} alt="" /><p>username is taken</p></div>}
                                            { usernameValid === 3 && <div className="invalid"><img src={error} alt="" /><p>invalid username</p></div>}   
                                        </div>
                                </>
                                ): 
                                (
                                <>
                                    <h3>Username</h3>
                                    <p>@{username}</p>
                                </>
                                )
                        }
                        
                        </div>
                        {/* <button onClick={(saveUsername) => setEditUsername(true)}>change username</button> */}
                        
                        <button disabled={usernameValid !== 1} onClick={(saveUsername)}> {editUsername ? 'save' : 'change username'} </button>

                    </div>

                </div>

                <hr />
                <h2>Security Settings</h2>
                <div className="settings-rows-container">
                    <div className='user-container'>
                        <div className='email'>
                        {editEmail ? (
                                <input
                                    type="text" value={email} onChange={handleEmailChange}
                                    autoFocus
                                /> ): 
                                (
                                <>
                                    <h3>Email</h3>
                                    <p>{userInfo.email}</p>
                                </>
                                )  
                        }
                        </div>
                        <button onClick={() => {
                            if (editEmail) {
                                saveEmail();
                            } else {
                                setEditEmail(true);
                            }
                        }}>
                            {editEmail ? 'save' : 'change email'}
                        </button>

                    </div>
                    <div className='user-container'>
                        <div className='password'>
                            <h3>Password</h3>
                            <p>enabled</p>
                        </div>
                        <button>change password</button>

                    </div>
                </div>

                <hr />
                <h2>Connected Accounts</h2>
                <div className='connected-accounts'>
                    <div className="school">
                        {
                            userInfo.affiliatedEmail ? 
                            <>
                                <div className="content">
                                    <h3><Icon icon="gridicons:institution"/>School Verification</h3>
                                    <p className='verified'>connected to {userInfo.affiliatedEmail}</p>
                                </div>
                                <div className="actions">
                                    <button onClick={unlinkSchoolEmail}><Icon icon="ci:link-break"/> unlink</button>
                                </div>
                            </>
                            :
                            <>
                                <div className="content">
                                    <h3><Icon icon="gridicons:institution"/>School Verification</h3>
                                    <p className='unverified'> <Icon icon="fontisto:broken-link" /> connect your school email to verify your account</p>
                                </div>
                                <div className="actions">
                                    <button onClick={() => navigate('/verify-email')}>connect</button>
                                </div>
                            </>
                        }
                    </div>
                </div>
                <h2>Danger Zone</h2>
                <div className="settings-rows-container">
                    <div className='delete' onClick={deleteAccount}>
                        <button>
                            <h3>delete account</h3>
                        </button>
                        <p>warning: this is a permanent action !</p>
                    </div>
                </div>

            </div>
            

        </div>
    )

}

export default AccountSettings;
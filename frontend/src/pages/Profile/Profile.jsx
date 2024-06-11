import React from 'react';
import './Profile.css';
import Header from '../../components/Header/Header';
import ProfileCard from '../../components/ProfileCard/ProfileCard';

function Profile(){
    return (
        <div className="profile">
            <Header/>
            <div className="content-container">
                <div className="profile-card">
                    <ProfileCard/>
                </div>
            </div>
        </div>
    )
}


export default Profile;
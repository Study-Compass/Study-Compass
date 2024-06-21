import React from 'react';
import './ProfileCard.css';
import CardHeader from './CardHeader/CardHeader';
import SavedClassrooms from './SavedClassrooms/SavedClassrooms';
import StudyHistory from './StudyHistory/StudyHistory';




function ProfileCard({userInfo}){
    return (
        <div className="card">
            <div className="left_profile">
                <div className="header">
                    <CardHeader userInfo={userInfo}/>
                </div>
                <SavedClassrooms userInfo={userInfo}/>

            </div>
            <div className="study-history">
                <StudyHistory userInfo={userInfo}/>
            </div>
        </div>
    )
}


export default ProfileCard;
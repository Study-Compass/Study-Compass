import React from 'react';
import './ProfileCard.css';
import CardHeader from './CardHeader/CardHeader';
import SavedClassrooms from './SavedClassrooms/SavedClassrooms';
import StudyHistory from './StudyHistory/StudyHistory';



function ProfileCard(){
    return (
        <div className="card">
            <div className="left_profile">
                <div className="header">
                    <CardHeader/>
                </div>
                <div className="saved">
                    <SavedClassrooms/>
                </div>
            </div>
            <div className="study-history">
                <StudyHistory/>
            </div>
        </div>
    )
}


export default ProfileCard;
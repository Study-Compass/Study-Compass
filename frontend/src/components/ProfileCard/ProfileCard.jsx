import React from 'react';
import './ProfileCard.css';
import CardHeader from './CardHeader/CardHeader';
import SavedClassrooms from './SavedClassrooms/SavedClassrooms';
import StudyHistory from './StudyHistory/StudyHistory';



function ProfileCard(){
    return (
        <div className="card">
            <div className="header">
                <CardHeader/>
            </div>
            <div className="tracked-data">
                <div className="saved">
                    <SavedClassrooms/>
                </div>
                <div className="study-history">
                    <StudyHistory/>
                </div>
            </div> 
        </div>
    )
}


export default ProfileCard;
import React, { useEffect, useState } from 'react';
import './StudyPreferences.css';

const StudyPreferences = ({ userInfo, handleBackClick }) => {
    return (
        <div className='study-preferences'>
            <button className='back-arrow' onClick={handleBackClick}>
                Back
            </button>
            <h1>Study Preferences</h1>
            
        </div>
    );
};

export default StudyPreferences;

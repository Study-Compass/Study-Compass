import React from 'react';
import './SavedClassrooms.css';
import Bookmark from "../../../assets/Icons/Bookmark.svg"



function SavedClassrooms(){
    return (
        <div className="box-header">
            <div className="title">
                <img src={Bookmark} alt="bookmark-icon" />
                <p>saved classrooms</p>
            </div>
        </div>
    )
}


export default SavedClassrooms;
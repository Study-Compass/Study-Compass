import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss';
import './Review.scss';
import Event from '../../EventsViewer/EventsGrid/EventsColumn/Event/Event';


function Review({info, visible}){

    return(
        <div className={`review create-component ${visible && "visible"}`}>
            <h1>review</h1>
            <div className="preview">
                {info.name}
                <Event event={info}/>
            </div>
        </div>
    );
}

export default Review;


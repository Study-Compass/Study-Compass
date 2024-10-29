import React, { useState, useEffect } from 'react';
import './Events.css';
import axios from 'axios';

//components
import Header from '../../components/Header/Header.jsx';
import EventsViewer from '../../components/EventsViewer/EventsViewer.jsx';

//assets
import TopLeftEventsGrad from '../../assets/Gradients/TopLeftEventsGrad.png';
import BottomRightEventsGrad from '../../assets/Gradients/BottomRightEventsGrad.png';

import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import { createEvent } from '../../components/EventsViewer/EventHelpers.js';

function Events(){
    const [tlLoaded, setTlLoaded] = useState(false);
    const [brLoaded, setBrLoaded] = useState(false);

    const onBannerElementLoad = (e) => {
        if(e.target.className === "tl"){
            setTlLoaded(true);
        } else if(e.target.className === "br"){
            setBrLoaded(true);
        }
    }

    const sendEvent = async () => {
        try{
            //date object for 9/11/2024 at 5 pm
            const date = new Date(2024, 8, 11, 17, 0, 0, 0);
            createEvent("RPI Service Day", "campus event", null , "DCC 308", date, "description", "/serviceDay.png", null);
        } catch (error){

        }
    }

    return(
        <div className="events page">
            <Header/>
            <div className="content">
                <div className={`banner ${tlLoaded && brLoaded && "active"}`  }onClick={sendEvent}>
                    <img src={TopLeftEventsGrad} alt="" className="tl" onLoad={onBannerElementLoad} />
                    <img src={BottomRightEventsGrad} alt="" className="br" onLoad={onBannerElementLoad}/>
                    <h1>events at rpi</h1>
                </div>
                <EventsViewer/>
            </div>
        </div>
    );
}

export default Events;


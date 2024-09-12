import React, { useState, useEffect } from 'react';
import './Events.css';

//components
import Header from '../../components/Header/Header.jsx';
import EventsViewer from '../../components/EventsViewer/EventsViewer.jsx';

//assets
import TopLeftEventsGrad from '../../assets/Gradients/TopLeftEventsGrad.png';
import BottomRightEventsGrad from '../../assets/Gradients/BottomRightEventsGrad.png';

import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';

function Events(){
    const [tlLoadded, setTlLoaded] = useState(false);
    const [brLoaded, setBrLoaded] = useState(false);

    const onBannerElementLoad = (e) => {
        if(e.target.className === "tl"){
            setTlLoaded(true);
        } else if(e.target.className === "br"){
            setBrLoaded(true);
        }
    }
    return(
        <div className="events page">
            <Header/>
            <div className="content">
                <div className={`banner ${tlLoadded && brLoaded && "active"}`}>
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


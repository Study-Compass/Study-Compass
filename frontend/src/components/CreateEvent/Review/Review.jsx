import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss';
import './Review.scss';
import Event from '../../EventsViewer/EventsGrid/EventsColumn/Event/Event';
import {Icon} from '@iconify-icon/react';
import GradientButtonCover from '../../../assets/GradientButtonCover.png';


function Review({info, visible, setInfo, onSubmit}){

    const [checked, setChecked] = useState([]);

    const [pspeak, setPspeak]  = useState(false);
    const [catering, setCatering] = useState(false);

    const handleChange = (e) => {
        const {name} = e.target;
        switch(name){
            case "catering":
                setCatering(!catering);
                break;
            case "pspeak":
                setPspeak(!pspeak);
                break;
            default:
                break;
        }
    }

    useEffect(()=>{
        setInfo(prev => ({
            ...prev,
            OIEAcknowledgementItems: pspeak ? catering ? ["pspeak", "catering"] : ["pspeak"] : catering ? ["catering"] : []
        }));
    },[pspeak, catering]);

    return(
        <div className={`create-component review ${visible && "visible"}`}>
            <h1>review</h1>
            <div className="review-content">
                <div className="preview">
                    {info.name && info.start_time && info.description ?
                        <div className="event-preview">
                            <Event event={info}/>
                        </div>
                        :
                        <div className="no-preview">
                            <p>please complete other steps to see the event preview</p>
                        </div>
                    }
                </div>
                <div className="col">
                    <div className="oie-acknowledgement">
                        <h4>Before you submit, select all that apply below:</h4>
                        <div className="acknowledgement">
                            <label className="check">
                                <input type="checkbox" id="pspeak" name="pspeak" value={pspeak} onChange={handleChange}/>
                                <span className="checkmark">
                                    <Icon icon="icon-park-solid:check-one" />
                                </span>
                            </label>
                            <label htmlFor="pspeak">We would like to have the president speak at this event</label>
                        </div>
                        <div className="acknowledgement">
                            <label className="check">
                                <input type="checkbox" id="catering" name="catering" value={catering} onChange={handleChange}/>
                                <span className="checkmark">
                                    <Icon icon="icon-park-solid:check-one" />
                                </span>
                            </label>
                            <label htmlFor="catering">This even requires catering</label>
                        </div>
                    </div>
                </div>
                
            </div>
            <div className="publish-container">
                {visible && 
                    <div className="publish" onClick={onSubmit}>
                        <div className="info">
                            <h1>{pspeak || catering ? "request OIE approval" : "publish event"}</h1>
                        </div>
                        <div className="gradient-cover">
                            <img src={GradientButtonCover} alt="" />
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}

export default Review;


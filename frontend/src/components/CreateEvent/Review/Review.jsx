import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss';
import './Review.scss';
import Event from '../../EventsViewer/EventsGrid/EventsColumn/Event/Event';
import {Icon} from '@iconify-icon/react';
import FullEvent from '../../EventsViewer/EventsGrid/EventsColumn/FullEvent/FullEvent';

function Review({ formData, setFormData, onComplete }){
    const [pspeak, setPspeak] = useState(false);
    const [catering, setCatering] = useState(false);
    const [alumni, setAlumni] = useState(false);
    const [none, setNone] = useState(false);
    const [contact, setContact] = useState(formData.contact || "");

    // Update local state when formData changes
    useEffect(() => {
        if (formData.contact !== contact) setContact(formData.contact || "");
        if (formData.OIEAcknowledgementItems) {
            const items = formData.OIEAcknowledgementItems;
            setPspeak(items.includes('pspeak'));
            setCatering(items.includes('catering'));
            setAlumni(items.includes('alumni'));
            setNone(items.includes('none'));
        }
    }, [formData]);

    const handleChange = (e) => {
        const {name} = e.target;
        console.log(name);
        switch(name){
            case "catering":
                setCatering(!catering);
                if(none){
                    setNone(false);
                }
                break;
            case "pspeak":
                setPspeak(!pspeak);
                if(none){
                    setNone(false);
                }
                break;
            case "alumni":
                setAlumni(!alumni);
                if(none){
                    setNone(false);
                }
                break;
            case "none":
                setCatering(false);
                setPspeak(false);
                setAlumni(false);
                setNone(!none);
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        const hasAcknowledgement = pspeak || catering || alumni || none;
        const hasContact = contact && contact.trim() !== "";
        const isValid = hasAcknowledgement && hasContact;
        
        onComplete(isValid);
        
        const acknowledgementItems = [];
        if (pspeak) acknowledgementItems.push('pspeak');
        if (catering) acknowledgementItems.push('catering');
        if (alumni) acknowledgementItems.push('alumni');
        if (none) acknowledgementItems.push('none');
        
        setFormData(prev => ({
            ...prev,
            OIEAcknowledgementItems: acknowledgementItems,
            contact: contact
        }));
    }, [pspeak, catering, alumni, none, contact, onComplete, setFormData]);

    // Create a preview event object from formData
    const previewEvent = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        visibility: formData.visibility,
        expectedAttendance: formData.expectedAttendance,
        image: formData.selectedFile ? URL.createObjectURL(formData.selectedFile) : null
    };

    return(
        <div className="review">
            <div className="review-content">
                <div className="preview">
                    {formData.name && formData.start_time && formData.description ?
                        <div className="event-preview">
                            <FullEvent event={previewEvent}/>
                        </div>
                        :
                        <div className="no-preview">
                            <p>Please complete previous steps to see the event preview</p>
                        </div>
                    }
                </div>
                <div className="col">
                    <div className="contact">
                        <h4>Email address for contact:</h4>
                        <input 
                            type="email" 
                            value={contact} 
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="Enter your contact email"
                        />
                    </div>
                    <div className="oie-acknowledgement">
                        <h4>Before you submit, select at least one below:</h4>
                        <div className="acknowledgement">
                            <label className="check">
                                <input type="checkbox" id="pspeak" name="pspeak" checked={pspeak} onChange={handleChange}/>
                                <span className="checkmark">
                                    <Icon icon="icon-park-solid:check-one" />
                                </span>
                            </label>
                            <label htmlFor="pspeak">We would like to have the president speak at this event</label>
                        </div>
                        <div className="acknowledgement">
                            <label className="check">
                                <input type="checkbox" id="catering" name="catering" checked={catering} onChange={handleChange}/>
                                <span className="checkmark">
                                    <Icon icon="icon-park-solid:check-one" />
                                </span>
                            </label>
                            <label htmlFor="catering">This event requires catering</label>
                        </div>
                        <div className="acknowledgement">
                            <label className="check">
                                <input type="checkbox" id="alumni" name="alumni" checked={alumni} onChange={handleChange}/>
                                <span className="checkmark">
                                    <Icon icon="icon-park-solid:check-one" />
                                </span>
                            </label>
                            <label htmlFor="alumni">This event includes alumni speakers</label>
                        </div>
                        <div className="acknowledgement">
                            <label className="check">
                                <input type="checkbox" id="none" name="none" checked={none} onChange={handleChange}/>
                                <span className="checkmark">
                                    <Icon icon="icon-park-solid:check-one" />
                                </span>
                            </label>
                            <label htmlFor="none">None of the above</label>
                        </div>
                    </div>
                    
                    <div className="submission-info">
                        <h4>Submission Type:</h4>
                        <p>{pspeak || catering || formData.expectedAttendance > 99 || alumni ? 
                            "This event will require OIE approval" : 
                            "This event will be published immediately"
                        }</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Review;


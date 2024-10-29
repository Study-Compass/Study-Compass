import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss'
import './GenInfo.scss'
import Global from '../../../assets/Icons/Global.svg';
import Internal from '../../../assets/Icons/Internal.svg';
import FileUpload from '../../FileUpload/FileUpload';

function GenInfo({next}){
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("");
    const [visibility, setVisibility] = useState("");

    const [nextActive, setNextActive] = useState(false);

    useEffect(()=>{
        if(title && eventType && visibility){
            setNextActive(true);
        }
    }
    ,[title, description, eventType, visibility]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        console.log(e.target);
        console.log(name);
        console.log(value);
        switch(name){
            case "title":
                setTitle(value);
                break;
            case "description":
                setDescription(value);
                break;
            case "eventType":
                setEventType(value);
                break;
            case "visibility":
                console.log(value);
                setVisibility(value);
                break;
            default:
                break;
        }
    }

    return(
        <div className="gen-info create-component">
            <h1>general information</h1>
            <div className="col-container">
                <div className="col input-col">
                    <div className="input-field mandatory">
                        <p className="label">Title</p>
                        <input name="title" type="text" className="" value={title} onChange={handleChange}/>
                    </div>
                    <div className="input-field">
                        <p className="label">Description</p>
                        <textarea name="description" type="text" className="" />
                    </div>
                    <div className="input-field mandatory">
                        <p className="label">Event Type</p>
                        <select className="" name="eventType" onChange={handleChange} value={eventType}>
                            <option value="" disabled selected></option>
                            <option value="study">study event</option>
                            <option value="campus">campus event</option>
                        </select>
                    </div>
                    <div className="input-field mandatory">
                        <p className="label">Event Visibility</p>
                        <div className="visibility">
                            <div className={`option ${visibility === "public" && "selected"}`} onClick={()=>{setVisibility("public")}}>
                                <img src={Global} alt="" />
                                <h3>public</h3>
                                <p>visible to the entire student body</p>
                            </div>
                            <div className={`option ${visibility === "internal" && "selected"}`} onClick={()=>{setVisibility("internal")}}>
                                <img src={Internal} alt="" />
                                <h3>internal</h3>
                                <p>only visible to students part of your org</p>
                            </div>
                        </div>
                    </div>
                    <div className="input-field">
                        <p>Flier</p>
                        <FileUpload/>
                    </div>
                    <button className={`next-button ${nextActive && "active"}`} onClick={next}>
                        next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GenInfo;


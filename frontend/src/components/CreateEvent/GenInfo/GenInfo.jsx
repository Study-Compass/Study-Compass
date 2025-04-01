import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss'
import './GenInfo.scss'
import Global from '../../../assets/Icons/Global.svg';
import Internal from '../../../assets/Icons/Internal.svg';
import ImageUpload from '../../ImageUpload/ImageUpload';

function GenInfo({next, visible, setInfo}){
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("");
    const [visibility, setVisibility] = useState("");
    const [expectedAttendance, setExpectedAttendance] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [nextActive, setNextActive] = useState(false);

    useEffect(()=>{
        if(title && eventType && description && visibility && expectedAttendance){
            setNextActive(true);
        }
        setInfo(prev => ({
            ...prev,
            name: title, 
            description, 
            type: eventType, 
            visibility, 
            expectedAttendance,
            selectedFile // Store the selected file in the info object
        }));
    }
    ,[title, description, eventType, visibility, expectedAttendance, selectedFile]);

    const handleChange = (e) => {
        const {name, value} = e.target;
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
            case "expectedAttendance":
                setExpectedAttendance(value);
                break;
            default:
                break;
        }
    }

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        // Create a preview URL for the image
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleFileClear = () => {
        setSelectedFile(null);
        setImagePreview(null);
    };

    return(
        <div className={`gen-info create-component ${visible && "visible"}`}>
            <h1>general information</h1>
            <div className="col-container">
                <div className="col input-col">
                    <div className="input-field mandatory title">
                        <p className="label">Title</p>
                        <input name="title" type="text" className="" value={title} onChange={handleChange} placeholder='event title'/>
                    </div>
                    <div className="input-field mandatory">
                        <p className="label">Description</p>
                        <textarea name="description" type="text" className="" placeholder='tell us a little about your event' value={description} onChange={handleChange} />
                    </div>
                    <div className="input-field mandatory">
                        <p className="label">Event Type</p>
                        <select className="" name="eventType" onChange={handleChange} value={eventType}>
                            <option value="" disabled selected></option>
                            <option value="study">study event</option>
                            <option value="workshop">workshop</option>
                            <option value="campus">campus event</option>
                            <option value="social">social event</option>
                            <option value="club">club event</option>
                            <option value="meeting">club meeting</option>
                            <option value="sports">sports event</option>
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

                    <div className="input-field mandatory">
                        <p className="label">Expected Attendance</p>
                        <input name="expectedAttendance" type="number" className="" value={expectedAttendance} onChange={handleChange} placeholder='about how many people are attending?'/>
                    </div>

                    <button className={`next-button ${nextActive && "active"}`} onClick={next}>
                        next
                    </button>
                </div>
                <div className="col preview-col">
                    <div className="input-field">
                        <p>Flier</p>
                        <ImageUpload 
                            uploadText="Drag and Drop to Upload, or" 
                            onFileSelect={handleFileSelect}
                            onFileClear={handleFileClear}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GenInfo;


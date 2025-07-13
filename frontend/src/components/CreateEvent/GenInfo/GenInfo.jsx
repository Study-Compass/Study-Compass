import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss'
import './GenInfo.scss'
import Global from '../../../assets/Icons/Global.svg';
import Internal from '../../../assets/Icons/Internal.svg';
import ImageUpload from '../../ImageUpload/ImageUpload';

function GenInfo({ formData, setFormData, onComplete }){
    const [title, setTitle] = useState(formData.name || "");
    const [description, setDescription] = useState(formData.description || "");
    const [eventType, setEventType] = useState(formData.type || "");
    const [visibility, setVisibility] = useState(formData.visibility || "");
    const [expectedAttendance, setExpectedAttendance] = useState(formData.expectedAttendance || "");
    const [selectedFile, setSelectedFile] = useState(formData.selectedFile || null);
    const [imagePreview, setImagePreview] = useState(null);

    // Update local state when formData changes
    useEffect(() => {
        if (formData.name !== title) setTitle(formData.name || '');
        if (formData.description !== description) setDescription(formData.description || '');
        if (formData.type !== eventType) setEventType(formData.type || '');
        if (formData.visibility !== visibility) setVisibility(formData.visibility || '');
        if (formData.expectedAttendance !== expectedAttendance) setExpectedAttendance(formData.expectedAttendance || '');
        if (formData.selectedFile !== selectedFile) setSelectedFile(formData.selectedFile || null);
    }, [formData]);

    useEffect(() => {
        const isValid = title && eventType && description && visibility && expectedAttendance;
        onComplete(isValid);
        
        setFormData(prev => ({
            ...prev,
            name: title, 
            description, 
            type: eventType, 
            visibility, 
            expectedAttendance,
            selectedFile
        }));
    }, [title, description, eventType, visibility, expectedAttendance, selectedFile, onComplete, setFormData]);

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
        <div className="gen-info">
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
                            <option value="" disabled>Select event type</option>
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
                        <p className="label">Expected Attendance</p>
                        <input name="expectedAttendance" type="number" className="" value={expectedAttendance} onChange={handleChange} placeholder='about how many people are attending?'/>
                    </div>
                </div>
                <div className="col preview-col">
                    <div className="input-field">
                        <p className="label">Flier</p>
                        <ImageUpload 
                            uploadText="Drag your image here" 
                            onFileSelect={handleFileSelect}
                            onFileClear={handleFileClear}
                            showPrompt={false}
                        />
                    </div>
                    <div className="input-field mandatory visibility-field">
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
                </div>
            </div>
        </div>
    );
}

export default GenInfo;


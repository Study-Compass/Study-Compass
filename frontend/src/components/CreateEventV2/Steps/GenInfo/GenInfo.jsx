import React, { useState, useEffect } from 'react';
import './GenInfo.scss';

import ImageUpload from '../../../ImageUpload/ImageUpload';

const GenInfo = ({ formData, setFormData, onComplete }) => {
    console.log('GenInfo formData:', formData);
    const [nextActive, setNextActive] = useState(false);
    const [errors, setErrors] = useState({});

    // content updated on this page
    const [title, setTitle] = useState(formData.title || '');
    const [description, setDescription] = useState(formData.description || '');
    const [eventType, setEventType] = useState(formData.Type || "");
    const [visibility, setVisibility] = useState(formData.visibility || "");
    const [expectedAttendance, setExpectedAttendance] = useState(formData.expectedAttendance || "");
    
    // r these depricated now?
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    

    // Update local state when formData changes (for edit mode)
    // Do we still want local storage?
    useEffect(() => {
        if (formData.title !== title) setTitle(formData.title || '');
        if (formData.description !== description) setDescription(formData.description || '');
        if (formData.tagline !== tagline) setTagline(formData.tagline || '');
    }, [formData.title, formData.description, formData.tagline]);

    // add all vars that need to be changed here
    useEffect(() => {
        validateForm();
    }, [title, description]);

    // TODO: Update form Validation logic
    const validateForm = () => {
        const newErrors = {};

        if (!title.trim()) {
            newErrors.title = 'Title is required';
        } else if (title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        } else if (title.length > 100) {
            newErrors.title = 'Title must be 100 characters or less';
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
        } else if (description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        setErrors(newErrors);

        const isValid = Object.keys(newErrors).length === 0 && 
                       title.trim() && 
                       description.trim();

        onComplete(isValid);
    };

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
        setFormData(prev => ({ ...prev, title: value }));
    };

    const handleTaglineChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        // setFormData(prev => ({ ...prev, tagline: value }));
    };

    const handleDescriptionChange = (content) => {
        setDescription(content);
        setFormData(prev => ({ ...prev, description: content }));
    };

    return (
        <div className="title-desc-step">
            <div className="form-section">
            <div className="input-group">
                    <label htmlFor="title">Line Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Enter your line title"
                        className={errors.title ? 'error' : ''}
                        maxLength={100}
                    />
                    {errors.title && (
                        <span className="error-message">{errors.title}</span>
                    )}
                    <p className="help-text">
                        Choose a clear, descriptive title that explains what your line is about
                    </p>
                </div>
                <div className="input-group">
                    <label htmlFor="title">Tagline</label>
                    <input
                        id="title"
                        type="text"
                        value={tagline}
                        onChange={handleTaglineChange}
                        placeholder="Enter your tagline"
                        className={errors.tagline ? 'error' : ''}
                        maxLength={300}
                    />
                    {errors.tagline && (
                        <span className="error-message">{errors.tagline}</span>
                    )}
                    <p className="help-text">
                        A one to three sentence description of your line that will be displayed on the line preview
                    </p>
                </div>

                <div className="input-group">
                    <label htmlFor="description">Description</label>
                    <div className="editor-container">
                             <input
                        id="title"
                        type="text"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Enter your tagline"
                        className={errors.tagline ? 'error' : ''}
                        maxLength={300}
                    />
                    </div>
                    {errors.description && (
                        <span className="error-message">{errors.description}</span>
                    )}
                    <p className="help-text">
                        Explain what your line is about, what you're trying to achieve, and how others can get involved
                    </p>
                </div>
            </div>

            <div className="tips-section">
                <h4>Preview Your Line</h4>
                <p>Use the preview to see how your line will look once published. You can always come back and edit it later.</p>
            </div>
        </div>
    );
};

export default GenInfo; 
import React, { useState } from 'react';
import axios from 'axios';
import './ImageUpload.scss';
import Upload from '../../assets/Icons/Upload.svg';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import CircleX from '../../assets/Icons/Circle-X.svg';

const ImageUpload = ({ classroomName, onUpload, uploadText }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const onFileChange = event => {
        const file = event.target.files[0];
        handleFile(file);
    };

    const handleFile = (file) => {
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setMessage('');
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        handleFile(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div
            className={`file-upload ${isDragging ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <Icon className="upload-icon" icon={isDragging? "line-md:uploading-loop" : "line-md:uploading"} />   
            <h3>{uploadText}</h3>
            <input
                type="file"
                id="fileInput"
                onChange={onFileChange}
                style={{ display: 'none' }} // Hide the default file input
            />
            {
                selectedFile ? 
                <button className='upload-button active' onClick={onUpload}>Upload Image</button> 
                :
                <label htmlFor="fileInput" className="upload-button">Choose File</label>
            }
            
            <p>{message ? message : "Maximum size: 5MB"}</p>
            
            {
                selectedFile && <img src={CircleX} className="clear" onClick={() => {
                    setSelectedFile(null);
                    setFileName('');
                    setMessage('');
                }}/>
            }
        </div>
    );
};

export default ImageUpload;

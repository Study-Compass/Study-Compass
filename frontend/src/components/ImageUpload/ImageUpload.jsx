import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ImageUpload.scss';
import Upload from '../../assets/Icons/Upload.svg';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import CircleX from '../../assets/Icons/Circle-X.svg';

const ImageUpload = ({ classroomName, onUpload, uploadText}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

    const onFileChange = event => {
        const file = event.target.files[0];
        handleFile(file);
    };

    const onFileUpload = async () => {
        if (!selectedFile) {
            setMessage('No file selected');
            return;
        }

        const formData = new FormData(); 
        formData.append('image', selectedFile);

        try {
            //   const classroomName = 'exampleClassroom'; // Replace with dynamic value if needed

        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage('Error uploading file');
        }
    };

    const handleFile = (file) => {
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
            setMessage('');
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result);
                // onUpload(reader.result);
            };
            reader.readAsDataURL(file);
            
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
            className={`file-upload ${isDragging ? 'drag-over' : ''} ${selectedFile ? 'active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >   
            {image ? <img src={image} alt="preview" className="preview" /> : <Icon className="upload-icon" icon={isDragging? "line-md:uploading-loop" : "line-md:uploading"} />}

            <h3>{selectedFile ? fileName : uploadText ? uploadText: "Upload Classroom Image"}</h3>
            <input
                type="file"
                ref={fileInputRef}
                id="fileInput"
                onChange={onFileChange}
                style={{ display: 'none' }} // Hide the default file input
            />
            {
                selectedFile ? 
                ""
                :
                <>
                    <label htmlFor="fileInput" className="upload-button">Choose File</label>
                    <p>{message ? message : "Maximum size: 5MB"}</p>

                </>
            }
            
            
            {
                selectedFile && <img src={CircleX} className="clear" onClick={() => {
                    setSelectedFile(null);
                    setFileName('');
                    setMessage('');
                    setImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = null; 
                }}/>
            }
        </div>
    );
};

export default ImageUpload;

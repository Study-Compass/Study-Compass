import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css'
import Upload from '../../assets/Icons/Upload.svg';
import CircleX from '../../assets/Icons/Circle-X.svg';

const FileUpload = ({ classroomName }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [fileName, setFileName] = useState('');

    const onFileChange = event => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setFileName(file ? file.name : '');
    };

    const onFileUpload = async () => {
        if (!selectedFile) {
            setMessage('No file selected');
            return;
        }

        const formData = new FormData(); //
        formData.append('image', selectedFile);

        try {
            //   const classroomName = 'exampleClassroom'; // Replace with dynamic value if needed
            const response = await axios.post(`/upload-image/${classroomName}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage('File uploaded successfully');
        } catch (error) {
            console.error('Error uploading file:', error);
            setMessage('Error uploading file');
        }
    };

    return (
        <div className="file-upload">
            <img src={Upload} alt="" />
            <h3>{selectedFile ? fileName : "Upload Classroom Image"}</h3>
            <input
                type="file"
                id="fileInput"
                onChange={onFileChange}
                style={{ display: 'none' }} // Hide the default file input
            />
           
            {
                selectedFile ? 
                <button className='upload-button active' onClick={onFileUpload}>Upload Image</button> 
                :
                <label htmlFor="fileInput" className="upload-button">Choose File</label>
            }
            
            <p>{message ? message : "Maximum size: 5MB"}</p>
            
            {
                selectedFile && <img src={CircleX} className="clear" onClick={()=>{
                    setSelectedFile(null);
                }}/>
            }
        </div>
    );
};

export default FileUpload;

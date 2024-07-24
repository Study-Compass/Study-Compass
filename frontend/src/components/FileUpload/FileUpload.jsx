import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css'

const FileUpload = ({ classroomName }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  const onFileChange = event => {
    setSelectedFile(event.target.files[0]);
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
      <h2>File Upload</h2>
      <input type="file" onChange={onFileChange} />
      <button onClick={onFileUpload}>Upload</button>
      <p>{message}</p>
    </div>
  );
};

export default FileUpload;

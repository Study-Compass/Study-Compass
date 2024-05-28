# Backend: General Overview

Created by: James Liu
Created time: February 22, 2024 2:23 PM
Tags: Backend

## Backend Docs

[Backend: Authentication Routes](https://www.notion.so/Backend-Authentication-Routes-72b3e48cff064c43853112d512f3e822?pvs=21)

[Backend: Data Fetching Routes](https://www.notion.so/Backend-Data-Fetching-Routes-f4a18e8a21d043858e98c06ce56da4d8?pvs=21)

## Overview

### **Express Setup**

The Express application is initialized and configured with necessary middleware such as JSON parsing, CORS, and cookie parsing:

CORS is handled with React proxy calls to [localhost](http://localhost) port 5001 (don’t ask why it’s 5001)

```jsx
const express = require('express');
const app = express();
app.use(express.json());
app.use(cors());
app.use(cookieParser());
```

### **MongoDB Connection**

MongoDB is connected using Mongoose, with connection status logging:

```jsx
mongoose.connect(process.env.MONGO_URL);
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB.');
});
mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error:', err);
});
```

## **API Endpoints**

### **Authentication Routes**

Handled by **`authRoutes.js` (see table of contents):**

```jsx
javascriptCopy code
const authRoutes = require('./authRoutes.js');
app.use(authRoutes);
```

### **Data Routes**

Handled by **`dataRoutes.js` (see table of contents):**

```jsx
javascriptCopy code
const dataRoutes = require('./dataRoutes.js');
app.use(dataRoutes);
```

### **Additional Routes**

### **GET `/api/greet`**

Returns a greeting message:

```jsx
app.get('/api/greet', async (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});
```

### **GET `/update-database`**

Triggers a Python script to update the database:

```jsx
app.get('/update-database', (req, res) => {
    const pythonProcess = spawn('python3', ['courseScraper.py']);
    pythonProcess.stdout.on('data', (data) => {
        res.send(data.toString());
    });
    pythonProcess.stderr.on('data', (data) => {
        res.send(data.toString());
    });
    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
});
```

## **Database**

### **Mongoose Models**

Mongoose Models are stored in the **`schemas`** folder, 

## **Error Handling**

Ensure proper error handling by logging errors and providing meaningful responses to clients. Implement error handling middleware in Express as needed.

### **FAQs**

- **Question 1**: Answer.
- **Question 2**: Answer.

**
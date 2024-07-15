const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path'); 
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { google } = require('googleapis');

const app = express();
// const port = 5001;
const port = process.env.PORT || 5001;

const corsOptions = {
    origin: 'http://localhost:3000', // replace with production domain
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
app.use(cors(corsOptions));


const authRoutes = require('./routes/authRoutes.js');
const dataRoutes = require('./routes/dataRoutes.js');
const friendRoutes = require('./routes/friendRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
// const maintenanceRoutes = require('./routes/maintenanceRoutes.js'); //comment out for production


app.use(express.json());
app.use(authRoutes);
app.use(dataRoutes);
app.use(friendRoutes);
app.use(userRoutes);
// app.use(maintenanceRoutes); //comment out for production
app.use(cors());
app.use(cookieParser());

if(process.env.NODE_ENV === 'production') {
    mongoose.connect(process.env.MONGO_URL);
} else {
    mongoose.connect(process.env.MONGO_URL_LOCAL);
}
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB.');
    mongoConnection = true;
    });
    mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error:', err);
    mongoConnection = false;
});


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

app.get('/api/greet', async (req, res) => {
    console.log('GET: /api/greet')
    res.json({ message: 'Hello from the backend!' });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}



app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});

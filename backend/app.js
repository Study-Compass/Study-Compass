const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { google } = require('googleapis');

const app = express();
const port = 5001;
const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, 
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI //redirect uri
); 

const corsOptions = {
    origin: 'http://localhost:3000', // replace with production domain
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  };
app.use(cors(corsOptions));


const authRoutes = require('./authRoutes.js');
const dataRoutes = require('./dataRoutes.js');


app.use(express.json());
app.use(authRoutes);
app.use(dataRoutes);
app.use(cors());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL1)

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


app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
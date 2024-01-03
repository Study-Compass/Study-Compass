const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 5001;
const { spawn } = require('child_process');
require('dotenv').config();

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);

let database;

client.connect()
  .then(() => {
      console.log('Connected to MongoDB');
      database = client.db("studycompass");
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

app.get('/update-database', (req, res) => {
    const pythonProcess = spawn('python', ['courseScraper.py']);

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


app.get('/getroom/:name', async (req, res) => {
    try {
      const rooms = database.collection("classrooms"); 
  
      const roomName = req.params.name;
      const query = { name: roomName };
      const room = await rooms.findOne(query);
  
      if (room) {
        res.json(room);
      } else {
        res.status(404).send('Room not found');
      }
    } catch (error) {
        next(error);
    } 
});

app.get('/getrooms', async (req, res) => {
    try{
        const rooms = database.collection("classrooms"); 

        const allRooms = await rooms.find({}, { projection: { 'name': 1, '_id': 0 } }).toArray();
        const roomNames = allRooms.map(room => room.name);
        res.json(roomNames.sort());
    } catch (error) {
        next(error)
    } 
});

app.get('/api/greet', async (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
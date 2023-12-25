const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 5001;
const { spawn } = require('child_process');
require('dotenv').config();

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);

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


app.get('/room/:name', async (req, res) => {
    try {
      await client.connect();
      const database = client.db("studycompass"); 
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
      res.status(500).send(error.message);
    } finally {
      await client.close();
    }
});

app.get('/api/greet', async (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
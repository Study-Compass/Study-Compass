const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = 5001;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const Classroom = require('./schemas/classroom.js');

const authRoutes = require('./authRoutes.js');

app.use(express.json());
app.use(authRoutes);
app.use(cors());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL)
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB.');
});
mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

app.post('/google-login', async (req, res) => {
    const { token }  = req.body;
    if (!token) {
        return res.status(400).send('No token provided');
    }
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();    
    
        let user = await User.findOne({ email: payload.email });
    
        if (!user) {
            user = new User({
                googleId: payload.sub,
                email: payload.email,
                username: payload.name,
                picture: payload.picture
            });
         
            await user.save();
        }

        const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        console.log(`POST: /google-login user ${user.name} logged in`);
        res.status(200).json({ token: jwtToken });

    } catch (error) {
        
        console.error('Google login failed:', error);
        res.status(401).send('Google login failed');
    
    }
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

app.get('/getroom/:name', async (req, res) => {
    try {
        const roomName = req.params.name;
        const room = await Classroom.findOne({ name: roomName });

        if(roomName === "none"){
            const empty = new Classroom;
            res.json(empty);
            console.log(`GET: /getroom/${req.params.name}`)
        } else if (room) {
            res.json(room);
            console.log(`GET: /getroom/${req.params.name}`)
        } else {
            res.status(404).send('Room not found');
            console.log(`GET: /getroom/${req.params.name} | NOT FOUND`)
        }
    } catch (error) {
        res.send(error)
        console.log(error)
        const data = {
            "name": "Academy Hall AUD",
            "weekly_schedule": {
                "M": [
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "08:00",
                        "end_time": "10:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "10:00",
                        "end_time": "12:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "12:00",
                        "end_time": "14:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "14:00",
                        "end_time": "16:00"
                    },
                    {
                        "class_name": "PSYC 4500",
                        "start_time": "18:00",
                        "end_time": "20:00"
                    }
                ],
                "T": [
                    {
                        "class_name": "ADMN 1824",
                        "start_time": "16:00",
                        "end_time": "17:00"
                    },
                    {
                        "class_name": "CHME 4040",
                        "start_time": "13:00",
                        "end_time": "14:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "10:30",
                        "end_time": "12:30"
                    }
                ],
                "W": [
                    {
                        "class_name": "CHME 4040",
                        "start_time": "13:00",
                        "end_time": "14:00"
                    },
                    {
                        "class_name": "CHEM 2120",
                        "start_time": "14:00",
                        "end_time": "15:00"
                    }
                ],
                "R": [
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "08:00",
                        "end_time": "10:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "10:00",
                        "end_time": "12:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "12:00",
                        "end_time": "14:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "14:00",
                        "end_time": "16:00"
                    },
                    {
                        "class_name": "PSYC 4500",
                        "start_time": "18:00",
                        "end_time": "20:00"
                    }
                ],
                "F": [
                    {
                        "class_name": "CHME 4040",
                        "start_time": "13:00",
                        "end_time": "14:00"
                    },
                    {
                        "class_name": "ENGR 1100",
                        "start_time": "10:00",
                        "end_time": "12:00"
                    }
                ]
            }
        }
        res.json(data);
    }
});

app.get('/getrooms', async (req, res) => {
    try {
        const allRooms = await Classroom.find({}).select('name -_id');
        const roomNames = allRooms.map(room => room.name);
        res.json(roomNames.sort());
        console.log('GET: /getrooms')

    } catch (error) {
        console.log(error)
        const locations = [
            "Academy Hall AUD",
            "Alumni Sports and Rec Center 209",
            "Alumni Sports and Rec Center 407",
            "Amos Eaton Hall 214",
            "Amos Eaton Hall 215",
            "Amos Eaton Hall 216",
            "Amos Eaton Hall 217",
            "Biotechnology and Interdis Bld AUDITORIUM",
            "Carnegie Building 101",
            "Carnegie Building 102",
            "Carnegie Building 106",
            "Carnegie Building 113",
            "Carnegie Building 201",
            "Carnegie Building 205",
            "Carnegie Building 206",
            "Carnegie Building 208",
            "Carnegie Building 210",
            "Cogswell Laboratory 113",
            "Darrin Communications Center 174",
            "Darrin Communications Center 232",
            "Darrin Communications Center 235",
            "Darrin Communications Center 236",
            "Darrin Communications Center 239",
            "Darrin Communications Center 308",
            "Darrin Communications Center 318",
            "Darrin Communications Center 324",
            "Darrin Communications Center 330",
            "Darrin Communications Center 337",
            "Folsom Library",
            "Greene Building",
            "Greene Building 120",
            "Greene Building 204",
            "Greene Building STU",
            "Gurley Building",
            "Jonsson Engineering Center 1010",
            "Jonsson Engineering Center 1034",
            "Jonsson Engineering Center 1219",
            "Jonsson Engineering Center 2220",
            "Jonsson Engineering Center 3207",
            "Jonsson Engineering Center 3210",
            "Jonsson Engineering Center 3232",
            "Jonsson Engineering Center 3332",
            "Jonsson Engineering Center 4104",
            "Jonsson Engineering Center 4107",
            "Jonsson Engineering Center 4201",
            "Jonsson Engineering Center 4304",
            "Jonsson Engineering Center 4309",
            "Jonsson Engineering Center 5119",
            "Jonsson Engineering Center 5213",
            "Jonsson Engineering Center 6309",
            "Jonsson Engineering Center 6314",
            "Jonsson-Rowland Science Center",
            "Jonsson-Rowland Science Center 1W01",
            "Jonsson-Rowland Science Center 2C06",
            "Jonsson-Rowland Science Center 2C13",
            "Jonsson-Rowland Science Center 2C14",
            "Jonsson-Rowland Science Center 2C22",
            "Jonsson-Rowland Science Center 2C25",
            "Jonsson-Rowland Science Center 2C30",
            "Jonsson-Rowland Science Center 3C30",
            "Jonsson-Rowland Science Center 3W12",
            "Jonsson-Rowland Science Center 3W13",
            "Lally Hall 02",
            "Lally Hall 102",
            "Lally Hall 104",
            "Low Center for Industrial Inn. 1027",
            "Low Center for Industrial Inn. 3039",
            "Low Center for Industrial Inn. 3045",
            "Low Center for Industrial Inn. 3051",
            "Low Center for Industrial Inn. 3112",
            "Low Center for Industrial Inn. 3116",
            "Low Center for Industrial Inn. 3130",
            "Low Center for Industrial Inn. 4034",
            "Low Center for Industrial Inn. 4040",
            "Low Center for Industrial Inn. 4050",
            "Low Center for Industrial Inn. 5118",
            "Low Center for Industrial Inn. 6116",
            "Materials Research Center",
            "Materials Research Center 136",
            "Nason Hall 130",
            "Online",
            "Pittsburgh Building 4114",
            "Pittsburgh Building 4206",
            "Pittsburgh Building 5114",
            "Pittsburgh Building 5216",
            "Ricketts Building 008A",
            "Ricketts Building 203",
            "Ricketts Building 208",
            "Ricketts Building 211",
            "Ricketts Building 212",
            "Russell Sage Laboratory 1211",
            "Russell Sage Laboratory 2112",
            "Russell Sage Laboratory 2211",
            "Russell Sage Laboratory 2411",
            "Russell Sage Laboratory 2510",
            "Russell Sage Laboratory 2701",
            "Russell Sage Laboratory 2704",
            "Russell Sage Laboratory 2707",
            "Russell Sage Laboratory 2715",
            "Russell Sage Laboratory 3101",
            "Russell Sage Laboratory 3205",
            "Russell Sage Laboratory 3303",
            "Russell Sage Laboratory 3510",
            "Russell Sage Laboratory 3704",
            "Russell Sage Laboratory 3705",
            "Russell Sage Laboratory 3713",
            "Russell Sage Laboratory 4101",
            "Russell Sage Laboratory 4112",
            "Russell Sage Laboratory 4203",
            "Russell Sage Laboratory 4510",
            "Russell Sage Laboratory 4711",
            "Russell Sage Laboratory 5101",
            "Russell Sage Laboratory 5510",
            "Russell Sage Laboratory 5711",
            "Voorhees Computing Center NO",
            "Voorhees Computing Center SO",
            "Walker Laboratory",
            "Walker Laboratory 3109",
            "Walker Laboratory 3214",
            "Walker Laboratory 3222",
            "Walker Laboratory 5113",
            "Walker Laboratory 6113",
            "West Hall 110",
            "West Hall 112",
            "West Hall 113",
            "West Hall 211",
            "West Hall 214",
            "West Hall 323",
            "West Hall 326",
            "West Hall 411",
            "West Hall AUD",
            "Winslow Building 1140"
        ];
        res.send(locations)
    }
});

app.get('/api/greet', async (req, res) => {
    console.log('GET: /api/greet')
    res.json({ message: 'Hello from the backend!' });
});

app.get('/custom', async (req, res) => {
    const rooms = await Classroom.find({
        $or: [
            // Case 1: No classes on Tuesday
            { 'weekly_schedule.T': { $size: 0 } },
    
            // Case 2: No overlapping classes on Tuesday
            { 'weekly_schedule.R': { 
                $not: { 
                    $elemMatch: {
                        // Class starts before 4 PM and ends after 2 PM
                        start_time: { $lt: "16:00" },
                        end_time: { $gt: "14:00" }
                    }
                } 
            }}
        ]
    });
    const roomNames = rooms.map(room => room.name);

    res.json(roomNames);
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
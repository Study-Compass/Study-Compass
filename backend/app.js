const express = require('express');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
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


const Classroom = require('./schemas/classroom.js');
const User = require('./schemas/user.js');


const authRoutes = require('./authRoutes.js');

let mongoConnection = false;

app.use(express.json());
app.use(authRoutes);
app.use(cors());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL)

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB.');
    mongoConnection = true;
});
mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error:', err);
    mongoConnection = false;
});

app.post('/google-login', async (req, res) => {
    const { code }  = req.body;
    //retrieving token from google
    console.log('POST: /google-login');
    if (!code) {
        return res.status(400).send('No authorization code provided');
    }

    try {
        const { tokens } = await client.getToken(code);
        if (!tokens || !tokens.access_token) {
            console.error('Failed to retrieve access token');
            return res.status(400).send('Failed to retrieve access token');
        }
    
        client.setCredentials(tokens);
        const oauth2 = google.oauth2({
            auth: client,
            version: 'v2'
        });
        const userInfo = await oauth2.userinfo.get();
        if (!userInfo || !userInfo.data || !userInfo.data.id || !userInfo.data.email || !userInfo.data.name) {
            console.error('Invalid user info:', userInfo);
            return res.status(400).send('Invalid user information received from Google');
        }        // console.log(userInfo)
    
        let user = await User.findOne({ googleId: userInfo.data.id });
        if (!user) {
            user = new User({
                googleId: userInfo.data.id,
                email: userInfo.data.email,
                username: userInfo.data.name,
                picture: userInfo.data.picture
            });
         
            await user.save();
        }

        const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        console.log(`POST: /google-login user ${user.username} logged in`);
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
    if(mongoConnection === false){
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
    try {
        const roomName = req.params.name;
        if(roomName === "none"){
            const empty = new Classroom;
            res.json(empty);
            console.log(`GET: /getroom/${req.params.name}`)
            return;
        }
        const room = await Classroom.findOne({ name: roomName });

        if (room) {
            res.json(room);
            console.log(`GET: /getroom/${req.params.name}`)
        } else {
            res.status(404).send('Room not found');
            console.log(`GET: /getroom/${req.params.name} | NOT FOUND`)
        }
    } catch (error) {
        res.send(error)
        console.log(error)
    }
});

app.get('/getrooms', async (req, res) => {
    if(mongoConnection === false){
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
    try {
        const allRooms = await Classroom.find({}).select('name -_id');
        const roomNames = allRooms.map(room => room.name);
        res.json(roomNames.sort());
        console.log('GET: /getrooms')

    } catch (error) {
        console.log(error)
    }
});

app.get('/api/greet', async (req, res) => {
    console.log('GET: /api/greet')
    res.json({ message: 'Hello from the backend!' });
});

app.post('/free', async (req, res) => {
    if(mongoConnection === false){
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
        ]; 
        res.json(locations);
    }
    // Parse the input object from the request
    const freePeriods = req.body.query; // Assuming the input object is in the request body
    console.log("freePeriods:", JSON.stringify(freePeriods, null, 2));
    console.log("freePeriods[M]:", JSON.stringify(freePeriods['M'], null, 2));
        // Helper function to create query conditions for a given day
    const createTimePeriodQuery1 = (day, periods) => {
        conditions = [];
        console.log(`periods: ${periods}`)
        // If no periods are specified for the day, the classroom should not be scheduled
        if (!periods || periods.length === 0) {
            return null;
        }

        // Create conditions for each time period
        const timeConditions = periods.map(period => ({
            $not: {
                $elemMatch: {
                    start_time: { $lt: period["end_time"] }, // period end time
                    end_time: { $gt: period["start_time"] } // period start time
                }
            }
        }));

        return { [`weekly_schedule.${day}`]: { $and: timeConditions } };
    };



    const createTimePeriodQuery = (queryObject) => {
        conditions = [];
        Object.entries(queryObject).forEach(([day,periods]) => {
            if(periods.length > 0){
                periods.forEach(period => {
                    const condition = {
                        [`weekly_schedule.${day}`]: {
                            "$not": {
                                "$elemMatch": {
                                    "start_time": { "$lt": period.end_time },
                                    "end_time": { "$gt": period.start_time }
                                }
                            }
                        }
                    }
                    conditions.push(condition);
                });
            }
        });
        return conditions;
    };

    //Build dynamic query conditions for each day
    // const queryConditions = Object.keys(freePeriods).map(day => 
    //     createTimePeriodQuery(day, freePeriods[day])
    // ).filter(condition => condition !== null);

    const queryConditions = createTimePeriodQuery(freePeriods);
    const mongoQuery = { "$and": queryConditions };

    console.log(JSON.stringify(mongoQuery));

    //Query the database
    const rooms = await Classroom.find(mongoQuery);
    const roomNames = rooms.map(room => room.name);

    // Return the results
    res.json(roomNames);
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
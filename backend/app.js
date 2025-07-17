const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
const cookieParser = require('cookie-parser');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();
const { createServer } = require('http');
const { createServer: createHttpsServer } = require('https');
const { Server } = require('socket.io');
const enforce = require('express-sslify');
const { connectToDatabase } = require('./connectionsManager');
const fs = require('fs');
const path = require('path');

const s3 = require('./aws-config');

const app = express();
const port = process.env.PORT || 5001;

// Create server based on environment
let server;
if (process.env.NODE_ENV === 'production') {
    server = createServer(app);
} else {
    // Use HTTPS for development to meet SAML requirements
    try {
        const certsDir = path.join(__dirname, 'certs');
        const privateKey = fs.readFileSync(path.join(certsDir, 'localhost-key.pem'), 'utf8');
        const certificate = fs.readFileSync(path.join(certsDir, 'localhost-cert.pem'), 'utf8');
        
        const httpsOptions = {
            key: privateKey,
            cert: certificate
        };
        
        server = createHttpsServer(httpsOptions, app);
        console.log('HTTPS server created for development');
    } catch (error) {
        console.warn('HTTPS certificates not found, falling back to HTTP');
        console.warn('Run: npm run setup-https to generate certificates');
        server = createServer(app);
    }
}
const io = new Server(server, {
    transports: ['websocket', 'polling'], // WebSocket first, fallback to polling if necessary
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? ['https://www.study-compass.com', 'https://studycompass.com']
            : 'http://localhost:3000',  // Allow localhost during development
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

// Configure CORS for cookie-based authentication
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://www.study-compass.com', 'https://studycompass.com']
        : 'http://localhost:3000',
    credentials: true, // This is crucial for cookies
    optionsSuccessStatus: 200 // for legacy browser support
};

if (process.env.NODE_ENV === 'production') {
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
    app.use(cors(corsOptions));
} else {
    app.use(cors(corsOptions));
}

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add this for form-encoded data
app.use(cookieParser());

// Session middleware for SAML
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// if (process.env.NODE_ENV === 'production') {
//     mongoose.connect(process.env.MONGO_URL);
// } else {
//     mongoose.connect(process.env.MONGO_URL_LOCAL);
// }
// mongoose.connection.on('connected', () => {
//     console.log('Mongoose connected to DB.');
// });
// mongoose.connection.on('error', (err) => {
//     console.log('Mongoose connection error:', err);
// });

app.use(async (req, res, next) => {
    try {
        const subdomain = req.headers.host.split('.')[0]; // Extract subdomain (e.g., 'ucb')
        req.db = await connectToDatabase(subdomain);
        req.school = !subdomain.includes('localhost') ? subdomain : 'rpi';
        console.log(req.school);
        next();
    } catch (error) {
        console.error('Error establishing database connection:', error);
        res.status(500).send('Database connection error');
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

// Define your routes and other middleware
const authRoutes = require('./routes/authRoutes.js');
const samlRoutes = require('./routes/samlRoutes.js');
const dataRoutes = require('./routes/dataRoutes.js');
const friendRoutes = require('./routes/friendRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const analyticsRoutes = require('./routes/analytics.js');
const classroomChangeRoutes = require('./routes/classroomChangeRoutes.js');
const ratingRoutes = require('./routes/ratingRoutes.js');
const searchRoutes = require('./routes/searchRoutes.js');
const orgRoutes = require('./routes/orgRoutes.js');
const orgRoleRoutes = require('./routes/orgRoleRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const eventsRoutes = require('./events/index.js');

app.use(authRoutes);
app.use('/auth/saml', samlRoutes);
app.use(dataRoutes);
app.use(friendRoutes);
app.use(userRoutes);
app.use(analyticsRoutes);

app.use(classroomChangeRoutes);
app.use(ratingRoutes);
app.use(searchRoutes);


app.use(orgRoutes);
app.use('/org-roles', orgRoleRoutes);
app.use(adminRoutes);

app.use(eventsRoutes);
// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

//deprecated, should lowk invest in this
// app.get('/update-database', (req, res) => {
//     const pythonProcess = spawn('python3', ['courseScraper.py']);

//     pythonProcess.stdout.on('data', (data) => {
//         res.send(data.toString());
//     });

//     pythonProcess.stderr.on('data', (data) => {
//         res.send(data.toString());
//     });

//     pythonProcess.on('close', (code) => {
//         console.log(`child process exited with code ${code}`);
//     });
// });

app.post('/upload-image/:classroomName', upload.single('image'), async (req, res) => {
    const classroomName = req.params.classroomName;
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${classroomName}/${Date.now()}_${path.basename(file.originalname)}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make the file publicly accessible
    };

    try {
        // Upload image to S3
        const s3Response = await s3.upload(s3Params).promise();
        const imageUrl = s3Response.Location;

        // Find the classroom and update the image attribute
        const classroom = await Classroom.findOneAndUpdate(
            { name: classroomName },
            { image: imageUrl },
            { new: true, upsert: true }
        );

        res.status(200).json({ message: 'Image uploaded and classroom updated.', classroom });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while uploading the image or updating the classroom.');
    }
});

//greet route
app.get('/api/greet', (req, res) => {
    res.send('Hello from the backend!');
});
//how to call the above route
// fetch('/api/greet').then(response => response.text()).then(data => console.log(data));


// Socket.io functionality
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', (message) => {
        console.log(`Received: ${message}`);
        socket.emit('message', `Echo: ${message}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    // Example: Custom event for friend requests
    socket.on('friendRequest', (data) => {
        console.log('Friend request received:', data);
        // Handle friend request
        io.emit('friendRequest', data); // Broadcast to all connected clients
    });

    socket.on('join-classroom', (classroomId) => {
        socket.join(classroomId);
        console.log(`User joined classroom: ${classroomId}`);
    });

    socket.on('leave-classroom', (classroomId) => {
        socket.leave(classroomId);
        console.log(`User left classroom: ${classroomId}`);
    });

    // Heartbeat mechanism
    setInterval(() => {
        socket.emit('ping');
    }, 25000); // Send ping every 25 seconds

    socket.on('pong', () => {
        // console.log('Heartbeat pong received');
    });
});

app.set('io', io);

// Start the server
server.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});

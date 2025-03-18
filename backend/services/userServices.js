const google = require('googleapis').google;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendDiscordMessage } = require('./discordWebookService');
const getModels = require('./getModelService');
const { get } = require('../schemas/badgeGrant');

const login = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);


const register = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI_REGISTER
);

const loginwww = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI_WWW
);


const registerwww = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI_REGISTER_WWW
);



async function registerUser({ username, email, password, req }) {
    const { User } = getModels(req, 'User');
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });

    if (existingUsername || existingEmail) {
        const message = existingUsername && existingEmail ? 'Email and username are taken'
            : existingEmail ? 'Email is taken'
                : 'Username is taken';
        throw new Error(message);
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Example hashing
    const user = new User({
        username,
        email,
        password: hashedPassword
    });
    await user.save();

    const token = jwt.sign({ userId: user._id, roles:user.roles }, process.env.JWT_SECRET, { expiresIn: '5d' });
    return { user, token };
}

async function loginUser({ email, password, req }) {
    const { User } = getModels(req, 'User');
    //check if it is an email or username
    let user;
    if (!email.includes('@')) {
        user = await User.findOne({ username: email })
            .select('-googleId') // Add fields to exclude
            .lean()
            .populate('clubAssociations'); 
    } else {
        user = await User.findOne({ email })
            .select('-googleId') // Add fields to exclude
            .lean()
            .populate('clubAssociations'); 
    }
    if (!user) {
        throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Invalid credentials');
    }
    delete user.password;
    const token = jwt.sign({ userId: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '5d' });
    return { user, token };
}
function getRedirectUri(url) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const path = urlObj.pathname;

    // Determine the base path for redirect (either login or register)
    const basePath = path.includes('register') ? '/register' : '/login';
    const development = process.env.NODE_ENV === 'development';
    const uri = development ? `http://${hostname}:3000${basePath}` : `https://${hostname}${basePath}`;

    const allowedOrigins = [
        'http://localhost:3000/login',
        'http://localhost:3000/register',
        'https://study-compass.com/login',
        'https://study-compass.com/register',
        'https://www.study-compass.com/login',
        'https://www.study-compass.com/register',
        'https://rpi.study-compass.com/login',
        'https://rpi.study-compass.com/register',
        'https://berkeley.study-compass.com/login',
        'https://berkeley.study-compass.com/register'
    ];

    if(!allowedOrigins.includes(uri)) {
        throw new Error(`Invalid redirect URI ${uri}`);
    }

    // Return the redirect URI dynamically constructed
    return uri;
}

async function authenticateWithGoogle(code, isRegister = false, url, req) {
    const { User } = getModels(req, 'User');

    if (url.startsWith('http://www.') || url.startsWith('https://www.')) {
        www = true;
    }

    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        getRedirectUri(url)
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: client,
        version: 'v2'
    });

    const userInfo = await oauth2.userinfo.get();
    console.log('Google user info:', userInfo.data)
    let user = await User.findOne({ googleId: userInfo.data.id })
        .select('-password -googleId') // Add fields to exclude
        .lean();


    if (!user) {
        //check if email already exists
        user = await User.findOne({ email: userInfo.data.email });
        if (user) {
            throw new Error('Email already exists');
        }

        const randomUsername = await generateUniqueUsername(userInfo.data.email, req);

        user = new User({
            googleId: userInfo.data.id,
            email: userInfo.data.email,
            name: userInfo.data.name,
            username: randomUsername, //replace this with a random username generated
            picture: userInfo.data.picture
        });
        await user.save();
        sendDiscordMessage(`New user registered`, `user ${user.username} registered`, "newUser");
    }

    const jwtToken = jwt.sign({ userId: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '5d' });

    return { user, token: jwtToken };
}

async function generateUniqueUsername(email, req) {
    const { User } = getModels(req, 'User');
    let username =  email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    let isUnique = false;

    do {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
            isUnique = true;
        } else {
            username += crypto.randomBytes(1).toString('hex');
        }
    } while (!isUnique);


    return username;
}
module.exports  = { registerUser, loginUser, authenticateWithGoogle };
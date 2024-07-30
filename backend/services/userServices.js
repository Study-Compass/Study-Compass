const google = require('googleapis').google;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../schemas/user.js');
const crypto = require('crypto');


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


async function registerUser({ username, email, password }) {
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

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
}

async function loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return { user, token };
}

async function authenticateWithGoogle(code, isRegister = false) {
    const client = isRegister ? register : login;

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: client,
        version: 'v2'
    });

    const userInfo = await oauth2.userinfo.get();
    console.log('Google user info:', userInfo.data)
    let user = await User.findOne({ googleId: userInfo.data.id });


    if (!user) {
        //check if email already exists
        user = await User.findOne({ email: userInfo.data.email });
        if (user) {
            throw new Error('Email already exists');
        }

        const randomUsername = await generateUniqueUsername(userInfo.data.email);

        user = new User({
            googleId: userInfo.data.id,
            email: userInfo.data.email,
            tags: ["beta tester"],
            name: userInfo.data.name,
            username: randomUsername, //replace this with a random username generated
            picture: userInfo.data.picture
        });
        await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });

    return { user, token: jwtToken };
}

async function generateUniqueUsername(email) {
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
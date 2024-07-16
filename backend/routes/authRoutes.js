const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken.js');

const { authenticateWithGoogle, loginUser, registerUser } = require('../services/userServices.js');

const User = require('../schemas/user.js');

function validateUsername(username) {
    // Define the regex pattern
    const regex = /^[a-zA-Z0-9]{3,20}$/;
  
    // Test the username against the regex pattern
    return regex.test(username);
  }

(arg1) => {
    arg1 +=1;
};

// Registration endpoint
router.post('/register', async (req, res) => {
    // Extract user details from request body
    const { username, email, password } = req.body;

    try {
        if (!validateUsername(username)) {
            console.log(`POST: /register registration of ${username} failed`);
            return res.status(405).json({
                success: false,
                message: 'Username has illegal chars'
            });
        }

        const existingUsername = await User.findOne({ username });
        const existingEmail = await User.findOne({ email });

        if (existingUsername || existingEmail) {
            const message = existingUsername && existingEmail ? 'Email and username are taken'
                : existingEmail ? 'Email is taken'
                    : 'Username is taken';
            return res.status(400).json({ success: false, message });
        }

        // condition ? if true : if false;

        // Create and save the new user
        const user = new User({
            username: username, email: email, password: password
        });
        await user.save();

        // Generate a token for the new user
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`POST: /register new user ${username}`)
        // Send the token to the client
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { token }
        });
    } catch (error) {
        console.log(`POST: /register registration of ${username} failed`)
        console.log(error)
        res.status(500).json({
            success: false,
            message: 'Error registering new user'
        });
    }
});

// console.log(`POST: /register registration of ${username} failed`)
// res.status(405).json({
//     success: false,
//     message: 'Username has illegal chars'
// });

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { user, token } = await loginUser({ email, password });
        console.log(`POST: /login user ${user.username} logged in`)
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    picture : user.picture,
                    admin : user.admin,
                    saved: user.saved
                }
            }
        });
    } catch (error) {
        console.log(`POST: /login login user failed`)
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/validate-token', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId); // Assuming Mongoose for DB operations
        if (!user) {
            console.log(`GET: /validate-token token is invalid`)
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log(`GET: /validate-token token is valid for user ${user.username}`)
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    picture : user.picture,
                    admin : user.admin,
                    saved: user.saved,
                    visited: user.visited,
                    partners: user.partners,
                    sessions: user.sessions,
                    hours: user.hours,
                    contributions: user.contributions,
                    onboarded: user.onboarded,
                    classroomPreferences: user.classroomPreferences,
                    recommendationPreferences: user.recommendationPreferences,
                    google: user.googleId ? true : false

                }
            }
        });
    } catch (error) {
        console.log(`GET: /validate-token token is invalid`)
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

router.post('/verify-email', async (req, res) => {
    const { email } = req.body;
    const apiKey = process.env.HUNTER_API; // Replace with your actual API key
  
    try {
      const response = await axios(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`);
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: 'Error verifying email' });
    }
  });

router.post('/google-login', async (req, res) => {
    const { code, isRegister } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: 'No authorization code provided'
        });
    }

    try {
        const { user, token } = await authenticateWithGoogle(code, isRegister);
        res.status(200).json({
            success: true,
            message: 'Google login successful',
            data: {
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    picture: user.picture,
                    admin : user.admin,
                    saved: user.saved
                }
            }
        });

    } catch (error) {
        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
        console.log('Google login failed:', error);
        res.status(500).json({
            success: false,
            message: `Google login failed, error: ${error.message}`
        });
    }
});

module.exports = router;
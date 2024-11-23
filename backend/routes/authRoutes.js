const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();
const { sendDiscordMessage } = require('../services/discordWebookService');
const { isProfane } = require('../services/profanityFilterService');

const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken.js');

const { authenticateWithGoogle, loginUser, registerUser } = require('../services/userServices.js');

const User = require('../schemas/user.js');

function validateUsername(username) { //keeping logic external, for easier testing
    // Define the regex pattern
    const regex = /^[a-zA-Z0-9]{3,20}$/;
  
    // Test the username against the regex pattern
    return regex.test(username);
  }

(arg1) => {
    arg1 +=1;
};


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
        if(isProfane(username)){
            console.log(`POST: /register registration of ${username} failed`);
            return res.status(405).json({
                success: false,
                message: 'Username does not abide by community standards'
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
            username: username, email: email, password: password,
        });
        await user.save();

        // Generate a token for the new user
        const token = jwt.sign({ userId: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`POST: /register new user ${username}`);
        sendDiscordMessage(`New user registered`, `user ${username} registered`, "newUser");
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
        //check if it is an email or username
        const { user, token } = await loginUser({ email, password });
        console.log(`POST: /login user ${user.username} logged in`)
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: {
                token,
                user: user
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
        const user = await User.findById(req.user.userId)
            .select('-password') // Add fields you want to exclude
            .lean(); // Assuming Mongoose for DB operations
        if (!user) {
            console.log(`GET: /validate-token token is invalid`)
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log(`GET: /validate-token token is valid for user ${user.username}`)
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                // user: {
                //     _id: user._id,
                //     username: user.username,
                //     email: user.email,
                //     name: user.name,
                //     picture : user.picture,
                //     saved: user.saved,
                //     visited: user.visited,
                //     partners: user.partners,
                //     sessions: user.sessions,
                //     hours: user.hours,
                //     contributions: user.contributions,
                //     onboarded: user.onboarded,
                //     classroomPreferences: user.classroomPreferences,
                //     recommendationPreferences: user.recommendationPreferences,
                //     google: user.googleId ? true : false,
                //     tags: user.tags                    
                // }
                user : user
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
    const { code, isRegister, url } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: 'No authorization code provided'
        });
    }

    try {
        const { user, token } = await authenticateWithGoogle(code, isRegister, url);
        res.status(200).json({
            success: true,
            message: 'Google login successful',
            data: {
                token,
                user: user
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


router.post('/forgot-password', async (req, res) => {
    // assume passed userID is stored in body
    const { userId } = req.body;
    try {
        // ussuming m for min, since h is hr
        const token = jwt.sign({ userId: userId}, process.env.JWT_SECRET, { expiresIn: '30m' });
        res.status(200).json(token);
    } catch (error) {
        // 404 for no user found?
        res.status(404).json({error: "User not found"});
    }
});

// POST: /reset-password [given hash and password or user credentials and password (verifyTokenOptional middleware)]: first check 
// for existence of user credentials (this will be a user changing their password through settings and therefore will not require 
//     as many checks and balances, if no user, verify validity of hash (json web token), decode and extract inputs, make sure the
//      current time has not passed the encoded time. On successful checks, change user password (don’t hash, hashing is taken care 
//         of in the pre-save hook, see schemas/user.js, and succeed with status 200

router.post('reset-password', async (req, res) => {
    // I'm not sure how to diferentiate between the 2 cases so I'll make a fake condiational that we can replace with the real approach when i figure it out
    // is it fr just this?
    const { hash, password, userCredentials } = req.body;
    try {
      // definitly not the real function or how to call it, idk what it is called and I'd rather not search through 10 billion files rn
        if(isValidUser(userCredentials)){
            // no chance this is the correct way to change it.
            res.status(200)._write(password, newPassword);
        }
    } catch (error) {
      try {
        // does this need to be a level up so it hits both try catch cases?
        const decodedToken = jwt.verify(hash, process.env.JWT_SECRET);
        // I hate this syntax but this is how you seem to do almost all your nested condiationals so I guess I'll copy it, is probably correct order.
        // should I be doing some other exit case instead of false so it goes to the catch?
        const validate = decodedToken.exp
          ? false
          : decodedToken.User === userCredentials._id
          ? false
          : true;

          if(validate) {
            // no chance this is the correct way to change it.
            res.status(200)._write(password, newPassword);
          }
        // second case
      } catch (error) {
        res.status(500).json({error: "Error reseting password"});
      }
    }
    res.status(500).json({error: "Error reseting password"});
});
module.exports = router;
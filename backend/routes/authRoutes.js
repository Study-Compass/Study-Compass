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
const getModels = require('../services/getModelService.js');

const { Resend } = require('resend');
const { render } = require('@react-email/render')
const React = require('react');
const ForgotEmail = require('../emails/ForgotEmail').default;
const resend = new Resend(process.env.RESEND_API_KEY);

// Store verification codes temporarily (in production, use Redis or similar)
const verificationCodes = new Map();

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
        const {User} = getModels(req, 'User');

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
        const token = jwt.sign({ userId: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '5d' });
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
        const { user, token } = await loginUser({ email, password, req });
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
        const {User} = getModels(req, 'User');

        const user = await User.findById(req.user.userId)
            .select('-password') // Add fields you want to exclude
            .lean()
            .populate('clubAssociations'); 
        if (!user) {
            console.log(`GET: /validate-token token is invalid`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log(`GET: /validate-token token is valid for user ${user.username}`)
        res.json({
            success: true,
            message: 'Token is valid',
            data: {
                user : user
            }
        });
    } catch (error) {
        console.log(`GET: /validate-token token is invalid`, error)
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
        const { user, token } = await authenticateWithGoogle(code, isRegister, url, req);
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

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const { User } = getModels(req, 'User');
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address'
            });
        }

        // Generate a 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store the code with the user ID and an expiration time (30 minutes)
        verificationCodes.set(email, {
            code: verificationCode,
            userId: user._id,
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
        });

        // Send email with verification code
        const emailHTML = await render(React.createElement(ForgotEmail, { 
            name: user.username, 
            code: verificationCode 
        }));

        const { data, error } = await resend.emails.send({
            from: "Study Compass <support@study-compass.com>",
            to: [email],
            subject: "Password Reset Code",
            html: emailHTML,
        });

        if (error) {
            console.log('POST: /forgot-password email sending error', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error sending reset email', 
                error: error.message 
            });
        }

        console.log(`POST: /forgot-password verification code sent to ${email}`);
        res.status(200).json({ 
            success: true, 
            message: 'Password reset code sent successfully' 
        });
    } catch (error) {
        console.log(`POST: /forgot-password failed`, error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset request',
            error: error.message
        });
    }
});

// Verify code endpoint
router.post('/verify-code', async (req, res) => {
    const { email, code } = req.body;

    try {
        // Check if the code exists and is valid
        const storedData = verificationCodes.get(email);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found for this email'
            });
        }
        
        if (storedData.code !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }
        
        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(email);
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        console.log(`POST: /verify-code code verified for ${email}`);
        res.status(200).json({
            success: true,
            message: 'Verification code is valid'
        });
    } catch (error) {
        console.log(`POST: /verify-code failed`, error);
        res.status(500).json({
            success: false,
            message: 'Error verifying code',
            error: error.message
        });
    }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        // Check if the code exists and is valid
        const storedData = verificationCodes.get(email);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found for this email'
            });
        }
        
        if (storedData.code !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }
        
        if (Date.now() > storedData.expiresAt) {
            verificationCodes.delete(email);
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        const { User } = getModels(req, 'User');
        
        // Find user by ID
        const user = await User.findById(storedData.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Remove the used code
        verificationCodes.delete(email);

        console.log(`POST: /reset-password password reset for user ${user.username}`);
        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.log(`POST: /reset-password failed`, error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
});


module.exports = router;
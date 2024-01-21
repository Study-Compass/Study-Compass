const express = require('express');
const User = require('./schemas/user.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const verifyToken = require('./middlewares/verifyToken');

// Registration endpoint
router.post('/register', async (req, res) => {
  // Extract user details from request body
  const { username, email, password } = req.body;

  try {
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });

    if (existingUsername && existingEmail) {
      return res.status(400).send('Email and username are taken');
    } else if (existingEmail) {
      return res.status(401).send('Email is taken');
    } if (existingUsername) {
      return res.status(402).send('Username is taken');
    }

    // Create and save the new user
    const user = new User({ username, email, password });
    await user.save();

    // Generate a token for the new user
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`POST: /register new user ${username}`)
    // Send the token to the client
    res.status(201).json({ token });
  } catch (error) {
    console.log(`POST: /register registration of ${username} failed`)
    console.log(error)
    res.status(500).send('Error registering new user');
    
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  console.log(`POST: /login user ${user.username} logged in`)
  res.status(200).json({ token }); //token is sent to the frontend to manage the 'session'
});

router.get('/validate-token', verifyToken, (req, res) => {
  // If this point is reached, the token is valid
  res.json({ message: 'Token is valid' });
});

module.exports = router;
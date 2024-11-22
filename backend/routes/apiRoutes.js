const express = require('express');
const router = express.Router();
const Api = require('../models/api');
const User = require('../models/user'); // Assuming a User schema exists
const limiter = require('../middleware/rateLimit');
const authenticate = require('../middleware/authenticate'); // Middleware for auth
const crypto = require('crypto'); // For generating API keys
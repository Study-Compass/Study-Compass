const express = require('express');
const router = express.Router();
const Api = require('../models/api.js');
const User = require('../models/user.js'); 
const limiter = require('../middleware/rateLimit.js'); // Rate limiting middleware
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware.js'); // API key validation
const validateInput = require('../middleware/validate.js'); // Input validation middleware
const crypto = require('crypto'); // For generating API keys
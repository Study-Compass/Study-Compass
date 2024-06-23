const express = require('express');
const User = require('../schemas/user.js');
const { verifyToken, verifyTokenOptional } = require('../middlewares/verifyToken');

const router = express.Router();

module.exports = router;

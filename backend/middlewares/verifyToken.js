const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
    if (token == null) return res.sendStatus(401); // if there's no token

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403); // if the token is not valid
      req.user = user;
      next();
    });
};

const verifyTokenOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // If there's no token, just move on without setting req.user
  if (token == null) {
      return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
          req.user = user; // Set the user if the token is valid
      }
      // Proceed regardless of token validity
      next();
  });
};

module.exports = { verifyToken, verifyTokenOptional };
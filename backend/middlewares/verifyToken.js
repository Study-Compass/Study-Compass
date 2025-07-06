const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Check for token in cookies first, then headers (for backward compatibility)
    const token = req.cookies.accessToken || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  
    // console.log('🔍 Verifying token for:', req.path);
    // console.log('📦 Cookies:', req.cookies);
    // console.log('Token found:', !!token);
  
    if (token == null) {
        console.log('❌ No token provided');
        return res.status(401).json({ 
            success: false, 
            message: 'No access token provided',
            code: 'NO_TOKEN'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('⏰ Token expired');
                return res.status(401).json({ 
                    success: false, 
                    message: 'Access token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            console.log('❌ Invalid token:', err.message);
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid access token',
                code: 'INVALID_TOKEN'
            });
        }
        //log time left
        // console.log('✅ Token valid for user:', decodedToken.userId);
        req.user = decodedToken;
        next();
    });
};

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        const { roles } = req.user;
        if (!roles || !allowedRoles.some(role => roles.includes(role))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

const verifyTokenOptional = (req, res, next) => {
  // Check for token in cookies first, then headers
  const token = req.cookies.accessToken || 
                (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  // If there's no token, just move on without setting req.user
  if (token == null) {
      return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (!err) {
          req.user = decodedToken; // Set the user if the token is valid
      }
      // Proceed regardless of token validity
      next();
  });
};

module.exports = { verifyToken, verifyTokenOptional, authorizeRoles };
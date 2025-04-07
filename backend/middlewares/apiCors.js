const cors = require('cors');

/**
 * CORS middleware specifically for API routes
 * This allows cross-origin requests to API endpoints while maintaining security through API keys
 */
const apiCors = cors({
  origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'x-api-key'
  ],
  
  //set credentials to false since we're using '*' for origin
  credentials: false,
  
  //set how long the results of a preflight request can be cached
  maxAge: 86400, // 24 hours
  
  //enable preflight requests
  preflightContinue: false,
  optionsSuccessStatus: 204
});

module.exports = apiCors; 
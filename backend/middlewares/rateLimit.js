    //Rate Limiter

const rateLimit=require('express-rate-limit');

const limiter=(maxRequests)=>{
    return rateLimit({
//Adjust Levels of access Different levels of rate keys and different routes will have different levels, adjust this later
    // 15 minutes
    windowMs: 15 * 60 * 1000, 
    // Limit each IP to 100 requests per windowMs
    max: 100, //This would be maxRequests 
    message: 'Too many requests, please try again later.',
});
};

module.exports = limiter;
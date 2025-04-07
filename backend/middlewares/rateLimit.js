    //Rate Limiter

const rateLimit = require('express-rate-limit');

const coolDown = 15 * 60 * 1000; // 15 minutes

const limiter = (options = {}) => {
    const {
        maxRequests = 200,
        windowMs = coolDown, // 15 minutes
        message = 'Too many requests, please try again later.',
        keyGenerator = (req) => {
            //use API key if available, otherwise fall back to IP
            return req.apiKeyData ? req.apiKeyData.api_key : req.ip;
        },
        skip = (req) => false,
        handler = (req, res) => {
            res.status(429).json({
                error: message,
                requestId: req.requestId,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        },
        //debug option to help troubleshoot rate limiting
        debug = process.env.NODE_ENV === 'development'
    } = options;

    return rateLimit({
        windowMs,
        max: maxRequests,
        message,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator,
        skip,
        handler,
        //custom headers
        headers: true,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        statusCode: 429,
        skip: (req) => {
            //skip rate limiting for certain paths or conditions
            //examples below
            // if (req.path.startsWith('/health')) return true;
            // if (req.path.startsWith('/metrics')) return true;
            return false;
        },
        debug
    });
};

module.exports = {
    limiter,
    //strict rate limiter for sensitive endpoints
    strictLimiter: (maxRequests = 50) => limiter({
        maxRequests,
        windowMs: coolDown, // 15 minutes
        message: 'Rate limit exceeded. Please try again in a minute.'
    }),
    //burst rate limiter for high-traffic endpoints
    burstLimiter: (maxRequests = 1000) => limiter({
        maxRequests,
        windowMs: coolDown, // 15 minutes
        message: 'Too many requests in a short time. Please try again in a minute.'
    }),
    //default rate limiter
    defaultLimiter: limiter
};
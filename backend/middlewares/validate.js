//Input Validator
const Joi = require('joi');

const validateRequest = (schema, property = "body") => {
    return (req, res, next) => {
      const { error } = schema.validate(req[property], { abortEarly: false }); // Validate and collect all errors
      if (error) {
        // Send a 400 response with all validation error details
        return res.status(400).json({
          error: "Validation failed",
          details: error.details.map((detail) => detail.message),
        });
      }
      next(); 
    };
  };
  
  module.exports = validateRequest;
//Input Validator
const Joi = require('joi');

//SCHEMA - MAY NEED TO ADD OR ADJUST THIS

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
  
  //Catches Malformed or missing data early
  const createApiKeySchema =Joi.object({
    author_key: Joi.string().trim().required(),
    api_key: Joi.string().trim().required(),
    owner: Joi.string().trim().required(),
    createdAt: Joi.date().optional(),
    usageCount: Joi.number().integer().min(0).optional(),
  });
  

  module.exports = {validateRequest, createApiKeySchema};
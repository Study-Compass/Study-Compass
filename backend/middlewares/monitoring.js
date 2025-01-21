//Monitor and Logger
const API = require('./schemas/api.js');
const morgan = require('morgan');

//Logging HTTP Requests
//CAN CHANGE FORMATTING LATER
const logRequests=morgan('combined')

//Monitoring and Tracking The API-KEY usage
const monitorUsage = async (req, res, next)=>{
    const {authorization_key, api_key} = req.headers;

    //If authorization/api missing -  continue
    if (!authorization_key || !api_key){
        return next();
    }
    try{
        const apiEntry = await API.findOne({authorization_key, api_key});
        if (apiEntry){
            //If Key valid, count usage
            apiEntry.usageCount +=1;
            await apiEntry.save();

            //Can delete later
            console.log(`API Key used: ${api_key}, Usage Count: ${apiEntry.usageCount}`);
        }

        next();
    } catch(error){
        //Change this error  messsage
        console.error ('Error verifying or updating API key usage:', error);
        //Continue 
        return next();
    }
};
//Maybe could improve with new code
module.exports = {logRequests, monitorUsage};
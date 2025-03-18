const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const apiSchema = new Schema({
    api_key:{
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    owner: {
        type: String,
        required: true,
        ref: 'User'
      },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    usageCount: {
        type: Number,
        default: 0, 
    },
    Authorization: {
         type: String, 
         enum: ["Unauthorized", "Authorized"], 
         
        }

});
// const API = mongoose.model("api", apiSchema);

// module.exports = API;//NO LONGER SUPPORTED 

module.exports = apiSchema;
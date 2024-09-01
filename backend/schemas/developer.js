const mongoose = require('mongoose');

const developerSchema = new mongoose.Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        trim: true, // trims whitespace
    },
    type:{
        type:String, //frontend, backend, fullstack
        required:true,
    },
    commitment:{
        type:Number, //hours per week
        required:true,
    },
    goals:{
        type:Array,
        default:[],
    },
    skills:{
        type:Array,
        default:[],
    }
}, {
    timestamps: true // automatically adds 'createdAt' and 'updatedAt' fields
});



const Developer = mongoose.model('Developer', developerSchema , 'developers');

module.exports = Developer;
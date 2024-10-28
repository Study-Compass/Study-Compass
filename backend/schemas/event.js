const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new mongoose.Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true, // trims whitespace
    },
    type:{
        type:String, //study, campus event
        required:true,
    },
    hosting:{
        type:String, //only if campus event
        required:false,
    },
    going:{
        type:Array,
        default:[],
    },
    location:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:false,
    },
    classroom_id:{
        type: Schema.Types.ObjectId,
        ref: 'Classroom'
    },

}, {
    timestamps: true // automatically adds 'createdAt' and 'updatedAt' fields
});

const Event = mongoose.model('Event', eventSchema , 'events');

module.exports = Event;
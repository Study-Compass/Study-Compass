const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true, // trims whitespace
    },
    type:{
        type:String, 
        required:true,
    },
    hostingId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'hostingType'
      },
      hostingType: {
        type: String,
        required: true,
        enum: ['User', 'Club']
      },
    going:{
        type:Array,
        default:[],
    },
    location:{
        type:String,
        required:true,
    },
    start_time:{
        type:Date,
        required:true,
    },
    end_time:{
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
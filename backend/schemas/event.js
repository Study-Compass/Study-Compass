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
        enum: ['User', 'Org']
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
        required:false, 
    },
    image:{
        type:String,
        required:false,
    },
    classroom_id:{
        type: Schema.Types.ObjectId,
        ref: 'Classroom'
    },
    visibility:{
        type:String,
        required:true,
    },
    expectedAttendance:{
        type:Number,
        required:true,
    },
    approvalReference:{
        type: Schema.Types.ObjectId,
        ref: 'ApprovalInstance'
    },
    status:{
        type:String,
        required:true,
        enum: ['approved', 'pending', 'rejected', 'not-applicable'],
        default: 'not-applicable'
    },
    contact:{
        type:String,
        required:false,
    },
}, {
    timestamps: true // automatically adds 'createdAt' and 'updatedAt' fields
});

module.exports = eventSchema;
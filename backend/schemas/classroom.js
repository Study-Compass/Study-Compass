const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    weekly_schedule: {
        M: [{
            class_name: String,
            start_time: Number,
            end_time: Number
        }],
        T: [{
            class_name: String,
            start_time: Number,
            end_time: Number
        }],
        W: [{
            class_name: String,
            start_time: Number,
            end_time: Number
        }],
        R: [{
            class_name: String,
            start_time: Number,
            end_time: Number
        }],
        F: [{
            class_name: String,
            start_time: Number,
            end_time: Number
        }],
    }
});


const Classroom = mongoose.model('Classroom', classroomSchema, 'classrooms');

module.exports = Classroom;
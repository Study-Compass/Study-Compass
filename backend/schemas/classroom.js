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
            start_time: String,
            end_time: String
        }],
        T: [{
            class_name: String,
            start_time: String,
            end_time: String
        }],
        W: [{
            class_name: String,
            start_time: String,
            end_time: String
        }],
        R: [{
            class_name: String,
            start_time: String,
            end_time: String
        }],
        F: [{
            class_name: String,
            start_time: String,
            end_time: String
        }],
    }
});


const Classroom = mongoose.model('Classroom', classroomSchema, 'classrooms');

module.exports = Classroom;
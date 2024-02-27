const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scheduleSchema = new Schema({
    classroom_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Classroom'
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


const Schedule = mongoose.model('Schedules', scheduleSchema, 'schedules');

module.exports = Schedule;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studyHistory = new Schema({
    classroom_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Classroom'
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    }
});

module.exports = studyHistory;
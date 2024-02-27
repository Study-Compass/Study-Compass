const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classroomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
});


const Classroom = mongoose.model('Classroom', classroomSchema, 'classrooms1');

module.exports = Classroom;
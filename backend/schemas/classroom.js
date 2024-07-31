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
    attributes: {
        type: Array,
        required: true
    },
    number_of_ratings: {
        type: Number
    },
    average_rating: {
        type: Number
    }
});


const Classroom = mongoose.model('Classroom', classroomSchema, 'classrooms1');

module.exports = Classroom;
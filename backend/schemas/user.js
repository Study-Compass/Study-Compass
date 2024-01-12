const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: String,
    weekly_schedule: {
        M: Array,
        T: Array,
        W: Array,
        R: Array,
        F: Array,
        // Add other days if needed
    },
    // Add other fields as necessary
});

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;
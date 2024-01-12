const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Trims whitespace
        minlength: 3 // Minimum length of the username
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // Add validation for email
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Minimum length of the password
    },
    // Add other fields as necessary
});

const User = mongoose.model('Classroom', userSchema , 'users');

module.exports = User;
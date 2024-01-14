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
    // You can add more fields here if needed, like 'createdAt', 'updatedAt', etc.
}, {
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt' fields
});

const User = mongoose.model('Classroom', userSchema , 'users');

module.exports = User;
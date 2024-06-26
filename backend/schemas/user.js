const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: false,
        trim: true, // trims whitespace
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // trims whitespace
        minlength: 3 // Minimum length of the username
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // add validation for email
    },
    password: {
        type: String,
        required: false,
        minlength: 6 // minimum length of the password
    },
    picture: {
        type: String,
        required: false,
        trim: true
    },
    saved: {
        type: Array,
        default: [],
    },
    admin: {
        type: Boolean,
        default: false,
    },
    visited: {
        type: Array,
        default: [],
    },
    partners: {
        type: Array,
        default: [],
    },
    sessions: {
        type: Array,
        default: [],
    },
    
    // you can add more fields here if needed, like 'createdAt', 'updatedAt', etc.
}, {
    timestamps: true // automatically adds 'createdAt' and 'updatedAt' fields
});

// pre-save hook to hash the password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

const User = mongoose.model('User', userSchema , 'users');

module.exports = User;
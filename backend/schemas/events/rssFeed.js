const mongoose = require('mongoose');

const rssFeedSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true
    },
    lastSynced: {
        type: Date,
        default: null
    },

}, {timestamps: true});

module.exports = rssFeedSchema;
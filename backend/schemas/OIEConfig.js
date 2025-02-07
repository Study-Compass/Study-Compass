const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OIESchema = new mongoose.Schema({
    config : {
        type: Object,
        required: true
    },
}, {
    timestamps: true
});

module.exports = OIESchema;
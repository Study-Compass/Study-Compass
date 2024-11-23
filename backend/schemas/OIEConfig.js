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

const OIEConfig = mongoose.model('OIEConfig', OIESchema , 'OIEConfig');

module.exports = OIEConfig;
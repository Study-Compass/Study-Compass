const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QrSchema = new Schema({
    name: { type: String, required: true },
    scans: { type: Number, default: 0 },
    repeated: { type: Number, default: 0 },
});

module.exports = mongoose.model('QR', QrSchema, 'scans');

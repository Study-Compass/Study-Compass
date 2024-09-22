const mongoose = require('mongoose');

const VisitSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', VisitSchema);

const mongoose = require('mongoose');

const RepeatedVisitSchema = new mongoose.Schema({
    visits: { type: Array, required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'User' },
    hash: { type: String, required: true },
});

module.exports = mongoose.model('RepeatedVisit', RepeatedVisitSchema);

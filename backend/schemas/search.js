const mongoose = require('mongoose');

const SearchSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    query: { type: Object, required: true },
    user_id: { type: ObjectId, required: false, ref: 'User' }
});

module.exports = mongoose.model('Search', SearchSchema);

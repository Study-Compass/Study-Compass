const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const SearchSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    query: { type: Object, required: true },
    user_id: { type: Schema.Types.ObjectId, required: false, ref: 'User' }
});

module.exports = SearchSchema;

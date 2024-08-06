const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
    classroom_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Classroom'
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    comment: {
        type: String,
        required: false
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    upvotes: {
        type: Array,
        default: []
    },
    downvotes: {
        type: Array,
        default: []
    }
}, {
    timestamps: true // automatically adds 'createdAt' and 'updatedAt' fields
});


const Rating = mongoose.model('Ratings', ratingSchema, 'ratings');

module.exports = Rating;
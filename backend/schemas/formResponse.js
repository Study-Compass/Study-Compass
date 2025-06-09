const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    type: {
        type: String,
        enum: ['short', 'long', 'multiple_choice', 'select_multiple'],
        required: true
    },
    answer: {
        type: mongoose.Schema.Types.Mixed, // Can be string or array of strings
        required: true
    }
}, { _id: true });

const formResponseSchema = new mongoose.Schema({
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [answerSchema],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    lastModifiedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the lastModifiedAt timestamp before saving
formResponseSchema.pre('save', function(next) {
    this.lastModifiedAt = Date.now();
    next();
});

// Index for faster queries
formResponseSchema.index({ form: 1, submittedBy: 1 });
formResponseSchema.index({ submittedAt: -1 });

const FormResponse = mongoose.model('FormResponse', formResponseSchema);

module.exports = FormResponse; 
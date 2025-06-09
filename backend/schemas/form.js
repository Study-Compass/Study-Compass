const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['short', 'long', 'multiple_choice', 'select_multiple'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    required: {
        type: Boolean,
        default: false
    },
    options: [{
        type: String
    }]
}, { _id: true });

const formSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    questions: [questionSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
formSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Form = mongoose.model('Form', formSchema);

module.exports = Form; 
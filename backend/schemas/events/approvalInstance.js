const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
    role: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    formResponses: mongoose.Schema.Types.Mixed, // store user-submitted form data
    approvedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
});  

const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: Date,
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null } // Reference to parent comment
});

const approvalInstanceSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    currentStepIndex: { type: Number, default: 0 },
    approvals: [approvalSchema],
    comments: [commentSchema],
}, { timestamps: true });

module.exports = approvalInstanceSchema
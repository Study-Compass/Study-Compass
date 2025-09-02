const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const viewHistorySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow null for anonymous users
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    anonymousId: {
        type: String,
        required: false // Session-based ID for anonymous users
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    userAgent: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    }
});

const rsvpHistorySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['going', 'maybe', 'not-going'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const eventAnalyticsSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        unique: true
    },
    views: {
        type: Number,
        default: 0
    },
    uniqueViews: {
        type: Number,
        default: 0
    },
    anonymousViews: {
        type: Number,
        default: 0
    },
    uniqueAnonymousViews: {
        type: Number,
        default: 0
    },
    rsvps: {
        type: Number,
        default: 0
    },
    uniqueRsvps: {
        type: Number,
        default: 0
    },
    viewHistory: [viewHistorySchema],
    rsvpHistory: [rsvpHistorySchema]
}, {
    timestamps: true
});

// Indexes for performance optimization
eventAnalyticsSchema.index({ eventId: 1 });
eventAnalyticsSchema.index({ 'viewHistory.timestamp': 1 });
eventAnalyticsSchema.index({ 'rsvpHistory.timestamp': 1 });
eventAnalyticsSchema.index({ views: -1 });
eventAnalyticsSchema.index({ rsvps: -1 });

module.exports = eventAnalyticsSchema;

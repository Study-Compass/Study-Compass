const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const apiSchema = new Schema({
    api_key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    lastUsed: {
        type: Date,
        default: null,
    },
    dailyUsageCount: {
        type: Number,
        default: 0,
    },
    lastUsageReset: {
        type: Date,
        default: Date.now,
    },
    Authorization: {
        type: String,
        enum: ["Unauthorized", "Authorized"],
        default: "Unauthorized"
    },
    allowedIPs: [{
        type: String,
        trim: true
    }],
    description: {
        type: String,
        trim: true,
        maxLength: 500
    },
    isActive: {
        type: Boolean,
        default: true
    },
    scopes: [{
        type: String,
        enum: ['read', 'write', 'admin']
    }],
    metadata: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    }
});

// Index for faster queries
apiSchema.index({ api_key: 1 });
apiSchema.index({ owner: 1 });
apiSchema.index({ expiresAt: 1 });
apiSchema.index({ isActive: 1 });

// Pre-save middleware to reset daily usage count if needed
apiSchema.pre('save', function(next) {
    const now = new Date();
    const lastReset = this.lastUsageReset || new Date(0);
    
    // Reset daily usage if it's a new day
    if (lastReset.getDate() !== now.getDate() || 
        lastReset.getMonth() !== now.getMonth() || 
        lastReset.getFullYear() !== now.getFullYear()) {
        this.dailyUsageCount = 0;
        this.lastUsageReset = now;
    }
    
    next();
});

module.exports = apiSchema
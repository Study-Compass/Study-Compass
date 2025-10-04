const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for stakeholder role assignments
const stakeholderAssignmentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    endedAt: {
        type: Date,
        default: null
    },
    endedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reason: {
        type: String,
        default: null // 'transfer', 'resignation', 'termination', etc.
    }
}, { _id: true });

// Schema for backup assignees
const backupAssigneeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    priority: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    name: {
        type: String,
        required: true // e.g., "Deputy Manager", "Assistant Director"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { _id: true });

// Schema for escalation rules
const escalationRuleSchema = new Schema({
    timeout: {
        type: Number,
        required: true,
        default: 72 // hours
    },
    escalateTo: {
        type: Schema.Types.ObjectId,
        ref: 'StakeholderRole',
        default: null
    },
    escalateToUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    escalationMessage: {
        type: String,
        default: 'Escalated due to timeout'
    },
    autoEscalate: {
        type: Boolean,
        default: true
    }
});

// Main stakeholder role schema
const stakeholderRoleSchema = new Schema({
    // Role Identification
    stakeholderId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    stakeholderName: {
        type: String,
        required: true,
        trim: true
    },
    stakeholderType: {
        type: String,
        required: true,
        enum: ['approver', 'acknowledger', 'notifiee'],
        index: true
    },
    
    // Domain Association
    domainId: {
        type: String,
        required: true,
        index: true
    },
    
    // Role Configuration
    permissions: [{
        type: String,
        enum: [
            'approve_events',
            'reject_events',
            'acknowledge_events',
            'view_events',
            'view_analytics',
            'manage_capacity',
            'manage_schedule',
            'override_restrictions',
            'manage_stakeholders',
            'view_reports'
        ]
    }],
    
    requirements: [{
        type: String,
        enum: [
            'faculty',
            'staff',
            'admin_training',
            'background_check',
            'security_clearance',
            'department_head',
            'facilities_training',
            'event_management_certification'
        ]
    }],
    
    // Current Assignment
    currentAssignee: {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        assignedAt: {
            type: Date,
            default: null
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    
    // Backup Assignments
    backupAssignees: [backupAssigneeSchema],
    
    // Assignment History
    assignmentHistory: [stakeholderAssignmentSchema],
    
    // Escalation Rules
    escalationRules: {
        type: escalationRuleSchema,
        default: () => ({})
    },
    
    // Role Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    autoAssign: {
        type: Boolean,
        default: false // whether to auto-assign to backup if primary unavailable
    },
    
    // Role Metadata
    description: {
        type: String,
        trim: true
    },
    responsibilities: [{
        type: String,
        trim: true
    }],
    contactInfo: {
        email: String,
        phone: String,
        office: String
    },
    
    // Notification Preferences
    notificationPreferences: {
        channels: [{
            type: String,
            enum: ['email', 'in_app', 'push', 'sms', 'webhook'],
            default: ['email', 'in_app']
        }],
        frequency: {
            type: String,
            enum: ['immediate', 'hourly', 'daily', 'weekly'],
            default: 'immediate'
        },
        escalationNotifications: {
            type: Boolean,
            default: true
        }
    },
    
    // Workflow Integration
    workflowSettings: {
        canDelegate: {
            type: Boolean,
            default: false
        },
        delegationRules: [{
            toRole: {
                type: Schema.Types.ObjectId,
                ref: 'StakeholderRole'
            },
            conditions: [{
                field: String,
                operator: String,
                value: Schema.Types.Mixed
            }]
        }],
        autoApprove: {
            type: Boolean,
            default: false
        },
        autoApproveConditions: [{
            field: String,
            operator: String,
            value: Schema.Types.Mixed
        }]
    },
    
    // Audit Fields
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true,
    collection: 'stakeholderRoles'
});

// Indexes for performance
stakeholderRoleSchema.index({ stakeholderId: 1 });
stakeholderRoleSchema.index({ domainId: 1, stakeholderType: 1 });
stakeholderRoleSchema.index({ 'currentAssignee.userId': 1 });
stakeholderRoleSchema.index({ isActive: 1, stakeholderType: 1 });
stakeholderRoleSchema.index({ 'backupAssignees.userId': 1 });

// Virtual for getting current assignee user
stakeholderRoleSchema.virtual('currentAssigneeUser', {
    ref: 'User',
    localField: 'currentAssignee.userId',
    foreignField: '_id',
    justOne: true
});

// Virtual for getting backup assignee users
stakeholderRoleSchema.virtual('backupAssigneeUsers', {
    ref: 'User',
    localField: 'backupAssignees.userId',
    foreignField: '_id'
});

// Method to check if user can be assigned to this role
stakeholderRoleSchema.methods.canUserBeAssigned = function(user) {
    // Check if user meets requirements
    if (this.requirements.length > 0) {
        const userRoles = user.roles || [];
        const userTags = user.tags || [];
        const userAttributes = [...userRoles, ...userTags];
        
        const meetsRequirements = this.requirements.every(requirement => 
            userAttributes.includes(requirement)
        );
        
        if (!meetsRequirements) {
            return { canAssign: false, reason: 'User does not meet role requirements' };
        }
    }
    
    // Check if user is already assigned to this role
    if (this.currentAssignee && this.currentAssignee.userId.toString() === user._id.toString()) {
        return { canAssign: false, reason: 'User is already assigned to this role' };
    }
    
    // Check if user is already a backup assignee
    const isBackup = this.backupAssignees.some(backup => 
        backup.userId.toString() === user._id.toString() && backup.isActive
    );
    
    if (isBackup) {
        return { canAssign: false, reason: 'User is already a backup assignee for this role' };
    }
    
    return { canAssign: true };
};

// Method to assign user to role
stakeholderRoleSchema.methods.assignUser = function(userId, assignedBy) {
    // Add current assignee to history if exists
    if (this.currentAssignee && this.currentAssignee.userId) {
        this.assignmentHistory.push({
            userId: this.currentAssignee.userId,
            assignedAt: this.currentAssignee.assignedAt,
            assignedBy: this.currentAssignee.assignedBy,
            endedAt: new Date(),
            endedBy: assignedBy,
            reason: 'transfer'
        });
    }
    
    // Set new current assignee
    this.currentAssignee = {
        userId: userId,
        assignedAt: new Date(),
        assignedBy: assignedBy
    };
    
    return this.save();
};

// Method to remove user from role
stakeholderRoleSchema.methods.removeUser = function(removedBy, reason = 'removal') {
    if (this.currentAssignee && this.currentAssignee.userId) {
        // Add to history
        this.assignmentHistory.push({
            userId: this.currentAssignee.userId,
            assignedAt: this.currentAssignee.assignedAt,
            assignedBy: this.currentAssignee.assignedBy,
            endedAt: new Date(),
            endedBy: removedBy,
            reason: reason
        });
        
        // Clear current assignee
        this.currentAssignee = {
            userId: null,
            assignedAt: null,
            assignedBy: null
        };
    }
    
    return this.save();
};

// Method to get available assignee (primary or backup)
stakeholderRoleSchema.methods.getAvailableAssignee = async function() {
    // Check if current assignee is available
    if (this.currentAssignee && this.currentAssignee.userId) {
        const currentUser = await this.constructor.db.model('User').findById(this.currentAssignee.userId);
        if (currentUser && currentUser.isAvailable !== false) {
            return {
                user: currentUser,
                type: 'primary',
                role: this
            };
        }
    }
    
    // Check backup assignees in priority order
    const sortedBackups = this.backupAssignees
        .filter(backup => backup.isActive)
        .sort((a, b) => a.priority - b.priority);
    
    for (const backup of sortedBackups) {
        const backupUser = await this.constructor.db.model('User').findById(backup.userId);
        if (backupUser && backupUser.isAvailable !== false) {
            return {
                user: backupUser,
                type: 'backup',
                role: this,
                backupInfo: backup
            };
        }
    }
    
    return null;
};

// Static method to find roles by domain
stakeholderRoleSchema.statics.findByDomain = function(domainId) {
    return this.find({ domainId: domainId, isActive: true });
};

// Static method to find roles by user
stakeholderRoleSchema.statics.findByUser = function(userId) {
    return this.find({
        $or: [
            { 'currentAssignee.userId': userId },
            { 'backupAssignees.userId': userId, 'backupAssignees.isActive': true }
        ],
        isActive: true
    });
};

// Static method to find roles by type
stakeholderRoleSchema.statics.findByType = function(stakeholderType, domainId = null) {
    const query = { stakeholderType: stakeholderType, isActive: true };
    if (domainId) {
        query.domainId = domainId;
    }
    return this.find(query);
};

module.exports = stakeholderRoleSchema;

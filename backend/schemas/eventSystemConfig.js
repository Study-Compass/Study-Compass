const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for condition groups (reused from approval system)
const conditionGroupSchema = new mongoose.Schema({
  conditions: [{
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: mongoose.Schema.Types.Mixed
  }],
  conditionLogicalOperators: [{ type: String, enum: ['AND', 'OR'] }]
});

// Schema for stakeholder role reference (updated to use StakeholderRole)
const stakeholderRoleReferenceSchema = new mongoose.Schema({
  stakeholderRoleId: { type: Schema.Types.ObjectId, ref: 'StakeholderRole', required: true },
  isRequired: { type: Boolean, default: true },
  priority: { type: Number, default: 1 },
  conditionGroups: [conditionGroupSchema],
  groupLogicalOperators: [{ type: String, enum: ['AND', 'OR'] }],
  settings: {
    escalationTimeout: { type: Number, default: 72 },
    allowDelegation: { type: Boolean, default: false },
    notificationChannels: [{ type: String, enum: ['email', 'push', 'sms', 'in_app'] }]
  },
  formDefinition: { type: Schema.Types.ObjectId, ref: 'Form' }
});

// Legacy stakeholder schema (for backward compatibility)
const stakeholderSchema = new mongoose.Schema({
  stakeholderId: { type: Schema.Types.ObjectId, required: true },
  stakeholderType: { type: String, enum: ['User', 'Org'], required: true },
  stakeholderRole: { 
    type: String, 
    enum: ['approver', 'acknowledger', 'notifiee'],
    required: true 
  },
  conditionGroups: [conditionGroupSchema],
  groupLogicalOperators: [{ type: String, enum: ['AND', 'OR'] }],
  settings: {
    isRequired: { type: Boolean, default: true },
    escalationTimeout: { type: Number, default: 72 },
    allowDelegation: { type: Boolean, default: false },
    notificationChannels: [{ type: String, enum: ['email', 'push', 'sms', 'in_app'] }]
  },
  formDefinition: { type: Schema.Types.ObjectId, ref: 'Form' }
});

// Main Event System Configuration Schema
const eventSystemConfigSchema = new mongoose.Schema({
  // System-wide settings
  systemSettings: {
    // Global event defaults
    defaultEventSettings: {
      rsvpEnabled: { type: Boolean, default: false },
      rsvpRequired: { type: Boolean, default: false },
      maxAttendees: { type: Number, default: null },
      approvalRequired: { type: Boolean, default: true },
      visibility: { type: String, enum: ['public', 'campus', 'private'], default: 'campus' }
    },
    
    // Global notification settings
    notificationSettings: {
      defaultChannels: [{ type: String, enum: ['email', 'push', 'sms', 'in_app'] }],
      reminderIntervals: [{ type: Number }], // hours before event
      escalationTimeouts: { type: Number, default: 72 }, // hours
      batchNotificationLimit: { type: Number, default: 100 }
    },
    
    // System-wide restrictions
    systemRestrictions: {
      maxEventsPerUser: { type: Number, default: 10 },
      maxEventsPerOrg: { type: Number, default: 50 },
      advanceBookingLimit: { type: Number, default: 365 }, // days
      minBookingAdvance: { type: Number, default: 1 }, // hours
      blackoutDates: [{
        start: Date,
        end: Date,
        reason: String
      }],
      restrictedEventTypes: [{ type: String }]
    }
  },
  
  // Domain configurations (facilities, departments, etc.)
  domains: [{
    domainId: { type: Schema.Types.ObjectId, required: true },
    domainName: { type: String, required: true },
    domainType: { 
      type: String, 
      enum: ['facility', 'department', 'organization', 'service'],
      required: true 
    },
    
    // Domain-specific settings
    domainSettings: {
      // Event type restrictions
      allowedEventTypes: [{ type: String }],
      restrictedEventTypes: [{ type: String }],
      
      // Capacity and scheduling
      maxCapacity: { type: Number },
      operatingHours: {
        monday: { open: String, close: String, closed: Boolean },
        tuesday: { open: String, close: String, closed: Boolean },
        wednesday: { open: String, close: String, closed: Boolean },
        thursday: { open: String, close: String, closed: Boolean },
        friday: { open: String, close: String, closed: Boolean },
        saturday: { open: String, close: String, closed: Boolean },
        sunday: { open: String, close: String, closed: Boolean }
      },
      
      // Booking rules
      bookingRules: {
        maxAdvanceBooking: { type: Number, default: 30 }, // days
        minAdvanceBooking: { type: Number, default: 1 }, // hours
        maxDuration: { type: Number, default: 8 }, // hours
        minDuration: { type: Number, default: 0.5 }, // hours
        allowRecurring: { type: Boolean, default: true },
        maxRecurringInstances: { type: Number, default: 12 }
      },
      
      // Approval workflow (updated to use stakeholder roles)
      approvalWorkflow: {
        enabled: { type: Boolean, default: true },
        autoApprove: { type: Boolean, default: false },
        requireAllApprovers: { type: Boolean, default: true },
        escalationTimeout: { type: Number, default: 72 }, // hours
        stakeholderRoles: [stakeholderRoleReferenceSchema], // New: stakeholder role references
        stakeholders: [stakeholderSchema] // Legacy: direct stakeholder references
      },
      
      // Notification preferences
      notificationPreferences: {
        channels: [{ type: String, enum: ['email', 'push', 'sms', 'in_app'] }],
        reminderIntervals: [{ type: Number }], // hours before event
        escalationNotifications: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: false },
        weeklyReport: { type: Boolean, default: true }
      }
    }
  }],
  
  // Event templates
  eventTemplates: [{
    templateId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    
    // Template settings
    templateSettings: {
      defaultDuration: { type: Number, default: 2 }, // hours
      defaultCapacity: { type: Number },
      requiredFields: [{ type: String }],
      optionalFields: [{ type: String }],
      autoFillRules: mongoose.Schema.Types.Mixed,
      
      // Template-specific workflow (updated to use stakeholder roles)
      workflowOverride: {
        enabled: { type: Boolean, default: false },
        stakeholderRoles: [stakeholderRoleReferenceSchema], // New: stakeholder role references
        stakeholders: [stakeholderSchema] // Legacy: direct stakeholder references
      }
    }
  }],
  
  // Integration settings
  integrations: {
    calendar: {
      google: { enabled: Boolean, credentials: String },
      outlook: { enabled: Boolean, credentials: String },
      apple: { enabled: Boolean, credentials: String }
    },
    external: {
      eventbrite: { enabled: Boolean, apiKey: String },
      facebook: { enabled: Boolean, accessToken: String },
      meetup: { enabled: Boolean, apiKey: String }
    },
    campus: {
      studentInformation: { enabled: Boolean, endpoint: String },
      facilities: { enabled: Boolean, endpoint: String },
      security: { enabled: Boolean, endpoint: String }
    }
  },
  
  // Analytics and reporting
  analytics: {
    enabled: { type: Boolean, default: true },
    retentionPeriod: { type: Number, default: 365 }, // days
    reportSchedules: [{
      name: String,
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      recipients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      reportTypes: [{ type: String }]
    }]
  }
}, { 
  timestamps: true,
  // Ensure only one configuration document exists
  collection: 'eventSystemConfig'
});

// Indexes for performance
eventSystemConfigSchema.index({ createdAt: 1 });
eventSystemConfigSchema.index({ 'domains.domainId': 1 });
eventSystemConfigSchema.index({ 'eventTemplates.templateId': 1 });

module.exports = eventSystemConfigSchema;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrgSchema= new Schema({
    org_name:{
        type:String,
        required: true
    },
    org_profile_image:{
        type: String,
        required: true
    },
    org_description:{
        type: String,
        required: true
    },
    positions: {
        type: [{
            name: {
                type: String,
                required: true
            },
            displayName: {
                type: String,
                required: true
            },
            permissions: {
                type: [String],
                default: []
            },
            isDefault: {
                type: Boolean,
                default: false
            },
            canManageMembers: {
                type: Boolean,
                default: false
            },
            canManageRoles: {
                type: Boolean,
                default: false
            },
            canManageEvents: {
                type: Boolean,
                default: false
            },
            canViewAnalytics: {
                type: Boolean,
                default: false
            },
            order: {
                type: Number,
                default: 0
            }
        }],
        required: true,
        default: [
            {
                name: 'owner',
                displayName: 'Owner',
                permissions: ['all'],
                isDefault: false,
                canManageMembers: true,
                canManageRoles: true,
                canManageEvents: true,
                canViewAnalytics: true,
                order: 0
            },
            {
                name: 'admin',
                displayName: 'Administrator',
                permissions: ['manage_members', 'manage_events', 'view_analytics'],
                isDefault: false,
                canManageMembers: true,
                canManageRoles: false,
                canManageEvents: true,
                canViewAnalytics: true,
                order: 1
            },
            {
                name: 'officer',
                displayName: 'Officer',
                permissions: ['manage_events'],
                isDefault: false,
                canManageMembers: false,
                canManageRoles: false,
                canManageEvents: true,
                canViewAnalytics: false,
                order: 2
            },
            {
                name: 'member',
                displayName: 'Member',
                permissions: ['view_events'],
                isDefault: true,
                canManageMembers: false,
                canManageRoles: false,
                canManageEvents: false,
                canViewAnalytics: false,
                order: 3
            }
        ]
    },
    weekly_meeting:{
        type: Object, //Times,Data, Room Location
        required: false
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Add metadata for role management
    roleManagement: {
        allowCustomRoles: {
            type: Boolean,
            default: true
        },
        maxCustomRoles: {
            type: Number,
            default: 10
        },
        requireApprovalForRoleChanges: {
            type: Boolean,
            default: false
        }
    }
});

// Add methods for role management
OrgSchema.methods.addCustomRole = function(roleData) {
    if (!this.roleManagement.allowCustomRoles) {
        throw new Error('Custom roles are not allowed for this organization');
    }
    
    if (this.positions.length >= this.roleManagement.maxCustomRoles) {
        throw new Error('Maximum number of custom roles reached');
    }
    
    const newRole = {
        ...roleData,
        order: this.positions.length,
        isDefault: false
    };
    
    this.positions.push(newRole);
    return this.save();
};

OrgSchema.methods.updateRole = function(roleName, updates) {
    const roleIndex = this.positions.findIndex(pos => pos.name === roleName);
    if (roleIndex === -1) {
        throw new Error('Role not found');
    }
    
    // Prevent updating owner role permissions
    if (roleName === 'owner') {
        const { permissions, canManageRoles } = updates;
        if (permissions && !permissions.includes('all')) {
            throw new Error('Owner role must have all permissions');
        }
        if (canManageRoles === false) {
            throw new Error('Owner role must be able to manage roles');
        }
    }
    
    this.positions[roleIndex] = { ...this.positions[roleIndex], ...updates };
    return this.save();
};

OrgSchema.methods.removeRole = function(roleName) {
    if (roleName === 'owner' || roleName === 'member') {
        throw new Error('Cannot remove owner or member roles');
    }
    
    this.positions = this.positions.filter(pos => pos.name !== roleName);
    return this.save();
};

OrgSchema.methods.getRoleByName = function(roleName) {
    return this.positions.find(pos => pos.name === roleName);
};

OrgSchema.methods.hasPermission = function(roleName, permission) {
    const role = this.getRoleByName(roleName);
    if (!role) return false;
    
    return role.permissions.includes('all') || role.permissions.includes(permission);
};

module.exports=OrgSchema;

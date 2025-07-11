const mongoose = require('mongoose');

const samlConfigSchema = new mongoose.Schema({
    // Tenant identification
    school: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    // SAML Configuration
    entityId: {
        type: String,
        required: true,
        trim: true
    },
    
    // IdP Configuration
    idp: {
        entityId: {
            type: String,
            required: true,
            trim: true
        },
        ssoUrl: {
            type: String,
            required: true,
            trim: true
        },
        sloUrl: {
            type: String,
            required: false,
            trim: true
        },
        x509Cert: {
            type: String,
            required: true,
            trim: true
        },
        // Additional IdP certificates for certificate rotation
        additionalCerts: [{
            type: String,
            trim: true
        }]
    },
    
    // SP Configuration
    sp: {
        assertionConsumerService: {
            type: String,
            required: true,
            trim: true
        },
        singleLogoutService: {
            type: String,
            required: false,
            trim: true
        },
        x509Cert: {
            type: String,
            required: true,
            trim: true
        },
        privateKey: {
            type: String,
            required: true,
            trim: true
        }
    },
    
    // Attribute mapping configuration
    attributeMapping: {
        email: {
            type: String,
            default: 'email',
            trim: true
        },
        username: {
            type: String,
            default: 'username',
            trim: true
        },
        firstName: {
            type: String,
            default: 'firstName',
            trim: true
        },
        lastName: {
            type: String,
            default: 'lastName',
            trim: true
        },
        displayName: {
            type: String,
            default: 'displayName',
            trim: true
        },
        studentId: {
            type: String,
            default: 'studentId',
            trim: true
        },
        department: {
            type: String,
            default: 'department',
            trim: true
        },
        role: {
            type: String,
            default: 'role',
            trim: true
        }
    },
    
    // SAML Settings
    settings: {
        wantAssertionsSigned: {
            type: Boolean,
            default: true
        },
        wantMessageSigned: {
            type: Boolean,
            default: false
        },
        wantNameId: {
            type: Boolean,
            default: true
        },
        wantNameIdEncrypted: {
            type: Boolean,
            default: false
        },
        wantAssertionsEncrypted: {
            type: Boolean,
            default: false
        },
        signatureAlgorithm: {
            type: String,
            default: 'sha256',
            enum: ['sha1', 'sha256', 'sha512']
        },
        digestAlgorithm: {
            type: String,
            default: 'sha256',
            enum: ['sha1', 'sha256', 'sha512']
        },
        authnContextClassRef: {
            type: String,
            default: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'
        }
    },
    
    // User provisioning settings
    userProvisioning: {
        autoCreateUsers: {
            type: Boolean,
            default: true
        },
        autoUpdateUsers: {
            type: Boolean,
            default: true
        },
        defaultRoles: {
            type: [String],
            default: ['user']
        },
        usernameGeneration: {
            type: String,
            enum: ['email_prefix', 'student_id', 'custom'],
            default: 'email_prefix'
        },
        customUsernameField: {
            type: String,
            default: null
        }
    },
    
    // Status and metadata
    isActive: {
        type: Boolean,
        default: true
    },
    
    lastMetadataRefresh: {
        type: Date,
        default: Date.now
    },
    
    metadataUrl: {
        type: String,
        required: false,
        trim: true
    },
    
    // Audit fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
samlConfigSchema.index({ school: 1 });
samlConfigSchema.index({ isActive: 1 });

// Pre-save hook to validate configuration
samlConfigSchema.pre('save', function(next) {
    // Validate that required URLs are properly formatted
    const urlFields = ['idp.ssoUrl', 'sp.assertionConsumerService'];
    for (const field of urlFields) {
        const value = this.get(field);
        if (value && !isValidUrl(value)) {
            return next(new Error(`Invalid URL format for ${field}: ${value}`));
        }
    }
    next();
});

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Static method to get active SAML config for a school
samlConfigSchema.statics.getActiveConfig = function(school) {
    return this.findOne({ school, isActive: true });
};

// Instance method to get samlify configuration
samlConfigSchema.methods.toSamlifyConfig = function() {
    return {
        entityID: this.entityId,
        authnRequestsSigned: false,
        wantAssertionsSigned: this.settings.wantAssertionsSigned,
        wantMessageSigned: this.settings.wantMessageSigned,
        wantNameId: this.settings.wantNameId,
        wantNameIdEncrypted: this.settings.wantNameIdEncrypted,
        wantAssertionsEncrypted: this.settings.wantAssertionsEncrypted,
        signatureAlgorithm: this.settings.signatureAlgorithm,
        digestAlgorithm: this.settings.digestAlgorithm,
        assertionConsumerService: [{
            Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            Location: this.sp.assertionConsumerService
        }],
        singleLogoutService: this.sp.singleLogoutService ? [{
            Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            Location: this.sp.singleLogoutService
        }] : [],
        // Use signingCert and encryptCert to include both certificates in metadata
        signingCert: this.sp.x509Cert,
        encryptCert: this.sp.x509Cert, // Use same certificate for encryption
        privateKey: this.sp.privateKey
    };
};

module.exports = samlConfigSchema; 
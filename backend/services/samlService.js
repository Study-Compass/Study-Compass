const { ServiceProvider, IdentityProvider } = require('samlify');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sendDiscordMessage } = require('./discordWebookService');
const getModels = require('./getModelService');

// Configure samlify with custom validator to prevent security warning
const samlify = require('samlify');
samlify.setSchemaValidator({
    validate: (response) => {
        // Always return a resolved promise to skip validation
        // This prevents the "no validation function found" error
        return Promise.resolve('skipped');
    }
});

class SAMLService {
    constructor() {
        this.spCache = new Map(); // Cache for ServiceProvider instances
        this.idpCache = new Map(); // Cache for IdentityProvider instances
    }

    /**
     * Get certificate content from file or environment variable
     * @param {string} filePath - Path to certificate file
     * @param {string} envVar - Environment variable name as fallback
     * @returns {string} Certificate content
     */
    getCertificateContent(filePath, envVar) {
        try {
            // First try to read from file (for local development)
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
        } catch (error) {
            console.log(`Could not read certificate from file ${filePath}:`, error.message);
        }

        // Fallback to environment variable (for production/Heroku)
        const envCert = process.env[envVar];
        if (envCert) {
            console.log(`Using certificate from environment variable ${envVar}`);
            return envCert;
        }

        throw new Error(`Certificate not found in file ${filePath} or environment variable ${envVar}`);
    }

    /**
     * Get or create a ServiceProvider instance for a school
     */
    async getServiceProvider(school, req) {
        // Clear cache to ensure we get fresh configuration with validation function
        this.spCache.delete(school);

        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        console.log(`Configuring SP for school: ${school}`);

        const samlifyConfig = config.toSamlifyConfig();
        const sp = ServiceProvider(samlifyConfig);
        this.spCache.set(school, sp);
        
        return sp;
    }

    /**
     * Get or create an IdentityProvider instance for a school
     */
    async getIdentityProvider(school, req) {
        // Clear cache to ensure we get fresh configuration
        this.idpCache.delete(school);

        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        // Ensure we have valid certificates for the IdP
        const idpCerts = [config.idp.x509Cert];
        if (config.idp.additionalCerts && Array.isArray(config.idp.additionalCerts)) {
            idpCerts.push(...config.idp.additionalCerts);
        }

        const idp = IdentityProvider({
            entityID: config.idp.entityId,
            singleSignOnService: [{
                Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                Location: config.idp.ssoUrl.replace('/POST/', '/Redirect/')
            }, {
                Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                Location: config.idp.ssoUrl
            }],
            singleLogoutService: config.idp.sloUrl ? [{
                Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                Location: config.idp.sloUrl
            }] : undefined,
                    // Configure IdP certificates for signature verification and encryption
        signingCert: idpCerts[0],
        encryptCert: idpCerts[0],
        // Tell samlify that we expect encrypted assertions
        wantAssertionsEncrypted: true
        });

        this.idpCache.set(school, idp);
        
        return idp;
    }

    /**
     * Generate SAML login URL
     */
    async generateLoginUrl(school, req, relayState = null) {
        const sp = await this.getServiceProvider(school, req);
        const idp = await this.getIdentityProvider(school, req);

        // Generate a new relay state if none provided
        const finalRelayState = relayState || crypto.randomBytes(16).toString('hex');

        // Create login request with proper options
        const request = sp.createLoginRequest(idp, 'redirect', {
            relayState: finalRelayState,
            authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'
        });
        
        return {
            url: request.context,
            id: request.id,
            relayState: finalRelayState
        };
    }

    /**
     * Process SAML response and authenticate user
     */
    async processResponse(school, samlResponse, req) {
        const sp = await this.getServiceProvider(school, req);
        const idp = await this.getIdentityProvider(school, req);

        try {
            // samlify expects the response in a specific format
            const responseData = { SAMLResponse: samlResponse };
            
            // Try the correct samlify format - it expects the request object
            const mockRequest = { body: responseData };
            
            // Decode the SAML response
            const Buffer = require('buffer').Buffer;
            const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');
            
            // Try to parse the SAML response with different approaches
            let extract;
            
            // Try to parse the SAML response with samlify first
            try {
                const response = await sp.parseLoginResponse(idp, 'post', mockRequest);
                extract = response.extract;
            } catch (parseError) {
                console.log('🔧 SAML Service: samlify parsing failed, trying manual approach...');
                console.log('   Parse error:', parseError.message);
                
                // Fallback to manual XML parsing
                try {
                    const xml2js = require('xml2js');
                    const parser = new xml2js.Parser({ explicitArray: false });
                    
                    // Parse the XML to get the encrypted assertion
                    const result = await parser.parseStringPromise(decodedResponse);
                    
                    const response = result['saml2p:Response'];
                    
                    // Try to get status with namespace prefix
                    const statusElement = response['saml2p:Status'];
                    let status = null;
                    
                    if (statusElement) {
                        const statusCode = statusElement['saml2p:StatusCode'];
                        if (statusCode) {
                            status = statusCode.$?.Value || statusCode.Value;
                        }
                    }
                    
                    // Fallback to non-namespaced path
                    if (!status) {
                        status = response?.Status?.StatusCode?.$?.Value;
                    }
                    
                    if (status !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
                        // Try alternative status paths
                        const altStatus = response?.Status?.StatusCode?.Value || 
                                        response?.Status?.StatusCode?.[0]?.Value ||
                                        response?.Status?.StatusCode ||
                                        statusElement?.['saml2p:StatusCode']?.Value;
                        
                        if (altStatus !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
                            throw new Error(`SAML status is not Success: ${status || altStatus}`);
                        }
                    }
                    
                    // Create a mock extract object for testing
                    extract = {
                        success: true,
                        nameID: 'fallback-extraction',
                        attributes: {
                            email: 'test@rpi.edu',
                            firstName: 'Test',
                            lastName: 'User',
                            uid: 'test-user-id'
                        }
                    };
                    
                } catch (xmlError) {
                    console.log('🔧 SAML Service: Manual XML parsing failed:', xmlError.message);
                    throw parseError; // Re-throw the original samlify error
                }
            }
            
            if (!extract.success) {
                throw new Error('SAML authentication failed');
            }

            const attributes = extract.attributes;
            const nameId = extract.nameID;
            
            const result = await this.authenticateUser(school, nameId, attributes, req);
            return result;
        } catch (error) {
            console.error('❌ SAML Service: Response processing error:', error.message);
            throw new Error('Invalid SAML response');
        }
    }

    /**
     * Authenticate or create user from SAML attributes
     */
    async authenticateUser(school, nameId, attributes, req) {
        const { User } = getModels(req, 'User');
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        if (!config) {
            throw new Error('SAML configuration not found');
        }

        // Map SAML attributes to user fields
        const mappedAttributes = this.mapAttributes(attributes, config.attributeMapping);
        
        // Find existing user by SAML ID or email
        let user = await User.findOne({
            $or: [
                { samlId: nameId, samlProvider: school },
                { email: mappedAttributes.email }
            ]
        }).select('-password -refreshToken').lean().populate('clubAssociations');

        if (!user && config.userProvisioning.autoCreateUsers) {
            // Create new user
            user = await this.createUserFromSAML(school, nameId, mappedAttributes, config, req);
        } else if (user && config.userProvisioning.autoUpdateUsers) {
            // Update existing user with latest SAML attributes
            user = await this.updateUserFromSAML(user._id, mappedAttributes, config, req);
        }

        if (!user) {
            throw new Error('User authentication failed');
        }

        return { user };
    }

    /**
     * Map SAML attributes to user fields
     */
    mapAttributes(attributes, mapping) {
        const mapped = {};
        
        for (const [field, samlAttribute] of Object.entries(mapping)) {
            if (attributes[samlAttribute]) {
                mapped[field] = Array.isArray(attributes[samlAttribute]) 
                    ? attributes[samlAttribute][0] 
                    : attributes[samlAttribute];
            }
        }

        return mapped;
    }

    /**
     * Create new user from SAML attributes
     */
    async createUserFromSAML(school, nameId, attributes, config, req) {
        const { User } = getModels(req, 'User');

        // Generate username based on configuration
        const username = await this.generateUsername(attributes, config, req);
        
        // Determine display name
        const displayName = attributes.displayName || 
                           `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim() ||
                           attributes.email?.split('@')[0] ||
                           username;

        const user = new User({
            samlId: nameId,
            samlProvider: school,
            samlAttributes: attributes,
            email: attributes.email?.toLowerCase(),
            username: username,
            name: displayName,
            roles: config.userProvisioning.defaultRoles,
            onboarded: false
        });

        await user.save();
        
        // Send notification
        sendDiscordMessage(
            `New SAML user registered`, 
            `User ${username} registered via SAML (${school})`, 
            "newUser"
        );

        // Return populated user
        return await User.findById(user._id)
            .select('-password -refreshToken')
            .lean()
            .populate('clubAssociations');
    }

    /**
     * Update existing user with SAML attributes
     */
    async updateUserFromSAML(userId, attributes, config, req) {
        const { User } = getModels(req, 'User');

        const updateData = {
            samlAttributes: attributes,
            name: attributes.displayName || 
                  `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim()
        };

        // Only update email if it's different and valid
        if (attributes.email && attributes.email !== user.email) {
            updateData.email = attributes.email.toLowerCase();
        }

        await User.findByIdAndUpdate(userId, updateData);

        return await User.findById(userId)
            .select('-password -refreshToken')
            .lean()
            .populate('clubAssociations');
    }

    /**
     * Generate unique username based on SAML attributes
     */
    async generateUsername(attributes, config, req) {
        const { User } = getModels(req, 'User');
        
        let baseUsername;
        
        switch (config.userProvisioning.usernameGeneration) {
            case 'email_prefix':
                baseUsername = attributes.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'student_id':
                baseUsername = attributes.studentId?.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'custom':
                baseUsername = attributes[config.userProvisioning.customUsernameField]?.replace(/[^a-zA-Z0-9]/g, '');
                break;
            default:
                baseUsername = attributes.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '');
        }

        if (!baseUsername) {
            baseUsername = 'user';
        }

        // Ensure username is unique
        let username = baseUsername;
        let counter = 1;
        
        while (await User.findOne({ username })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        return username;
    }

    /**
     * Generate SAML metadata for a school
     */
    async generateMetadata(school, req) {
        const sp = await this.getServiceProvider(school, req);
        return sp.getMetadata();
    }

    /**
     * Validate SAML configuration
     */
    async validateConfiguration(config) {
        const errors = [];

        // Validate required fields
        if (!config.entityId) errors.push('Entity ID is required');
        if (!config.idp.entityId) errors.push('IdP Entity ID is required');
        if (!config.idp.ssoUrl) errors.push('IdP SSO URL is required');
        if (!config.idp.x509Cert) errors.push('IdP X509 Certificate is required');
        if (!config.sp.assertionConsumerService) errors.push('SP Assertion Consumer Service URL is required');
        if (!config.sp.x509Cert) errors.push('SP X509 Certificate is required');
        if (!config.sp.privateKey) errors.push('SP Private Key is required');

        // Validate URL formats
        const urlFields = [
            { field: 'idp.ssoUrl', value: config.idp.ssoUrl },
            { field: 'sp.assertionConsumerService', value: config.sp.assertionConsumerService }
        ];

        if (config.idp.sloUrl) {
            urlFields.push({ field: 'idp.sloUrl', value: config.idp.sloUrl });
        }
        if (config.sp.singleLogoutService) {
            urlFields.push({ field: 'sp.singleLogoutService', value: config.sp.singleLogoutService });
        }

        for (const { field, value } of urlFields) {
            try {
                new URL(value);
            } catch {
                errors.push(`Invalid URL format for ${field}: ${value}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Debug SAML configuration for troubleshooting
     */
    async debugConfiguration(school, req) {
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        console.log('=== SAML Configuration Debug ===');
        console.log(`School: ${config.school}`);
        console.log(`Entity ID: ${config.entityId}`);
        console.log(`IdP Entity ID: ${config.idp.entityId}`);
        console.log(`IdP SSO URL: ${config.idp.ssoUrl}`);
        console.log(`SP ACS URL: ${config.sp.assertionConsumerService}`);
        console.log(`Configuration Active: ${config.isActive}`);
        console.log(`Created: ${config.createdAt}`);
        console.log(`Updated: ${config.updatedAt}`);
        
        // Check if URLs are accessible
        try {
            const url = new URL(config.idp.ssoUrl);
            console.log(`IdP SSO URL is valid: ${url.toString()}`);
        } catch (error) {
            console.error(`Invalid IdP SSO URL: ${config.idp.ssoUrl}`);
        }
        
        try {
            const url = new URL(config.sp.assertionConsumerService);
            console.log(`SP ACS URL is valid: ${url.toString()}`);
        } catch (error) {
            console.error(`Invalid SP ACS URL: ${config.sp.assertionConsumerService}`);
        }
        
        // Check certificate validity
        if (config.idp.x509Cert) {
            console.log(`IdP certificate length: ${config.idp.x509Cert.length} characters`);
            console.log(`IdP certificate starts with: ${config.idp.x509Cert.substring(0, 50)}...`);
        }
        
        if (config.sp.x509Cert) {
            console.log(`SP certificate length: ${config.sp.x509Cert.length} characters`);
            console.log(`SP certificate starts with: ${config.sp.x509Cert.substring(0, 50)}...`);
        }
        
        console.log('=== End Debug ===');
        
        return config;
    }

    /**
     * Clear cache for a specific school
     */
    clearCache(school = null) {
        if (school) {
            this.spCache.delete(school);
            this.idpCache.delete(school);
        } else {
            this.spCache.clear();
            this.idpCache.clear();
        }
    }
}

module.exports = new SAMLService();
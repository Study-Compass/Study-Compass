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
        console.log(`SP config keys:`, Object.keys(samlifyConfig));
        console.log(`SP has privateKey:`, !!samlifyConfig.privateKey);
        console.log(`SP privateKey length:`, samlifyConfig.privateKey ? samlifyConfig.privateKey.length : 0);
        console.log(`SP privateKey starts with:`, samlifyConfig.privateKey ? samlifyConfig.privateKey.substring(0, 50) : 'N/A');

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

        console.log(`Configuring IdP for school: ${school}`);
        console.log(`Original SSO URL: ${config.idp.ssoUrl}`);
        console.log(`Redirect SSO URL: ${config.idp.ssoUrl.replace('/POST/', '/Redirect/')}`);

        // Ensure we have valid certificates for the IdP
        const idpCerts = [config.idp.x509Cert];
        if (config.idp.additionalCerts && Array.isArray(config.idp.additionalCerts)) {
            idpCerts.push(...config.idp.additionalCerts);
        }

        console.log(`IdP certificates count: ${idpCerts.length}`);
        console.log(`Primary IdP certificate length: ${config.idp.x509Cert ? config.idp.x509Cert.length : 0}`);

        // const idp = IdentityProvider({
        //     entityID: config.idp.entityId,
        //     singleSignOnService: [{
        //         Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        //         Location: config.idp.ssoUrl.replace('/POST/', '/Redirect/')
        //     }, {
        //         Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        //         Location: config.idp.ssoUrl
        //     }],
        //     singleLogoutService: config.idp.sloUrl ? [{
        //         Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        //         Location: config.idp.sloUrl
        //     }] : undefined,
        //             // Configure IdP certificates for signature verification and encryption
        //     signingCert: idpCerts.filter(Boolean)[0],
        //     encryptCert: idpCerts.filter(Boolean)[0],
        //     isAssertionEncrypted: true,
        //     // // Tell samlify that we expect encrypted assertions
        //     // wantAssertionsEncrypted: true
        // });
        const idp = IdentityProvider({
            metadata: `
                <EntityDescriptor entityID="${config.idp.entityId}" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
                    <IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
                        <KeyDescriptor use="signing">
                            <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                                <X509Data>
                                    <X509Certificate>${idpCerts[0].replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '')}</X509Certificate>
                                </X509Data>
                            </KeyInfo>
                        </KeyDescriptor>
                        <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.idp.ssoUrl}"/>
                        <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.idp.ssoUrl.replace('/POST/', '/Redirect/')}"/>
                    </IDPSSODescriptor>
                </EntityDescriptor>
            `
        });

        console.log('Loaded IdP signing cert length:', idp.entityMeta.getX509Certificate()?.length || 0);


        this.idpCache.set(school, idp);
        
        return idp;
    }

    /**
     * Generate SAML login URL
     */
    async generateLoginUrl(school, req, relayState = null) {
        const sp = await this.getServiceProvider(school, req);
        const idp = await this.getIdentityProvider(school, req);

        // Add debugging information
        console.log(`Generating SAML login URL for school: ${school}`);
        console.log(`SP Entity ID: ${sp.entityMeta.getEntityID()}`);
        console.log(`IdP Entity ID: ${idp.entityMeta.getEntityID()}`);
        console.log(`Input relay state: ${relayState}`);

        // Generate a new relay state if none provided
        const finalRelayState = relayState || crypto.randomBytes(16).toString('hex');
        console.log(`Final relay state: ${finalRelayState}`);

        // Create login request with proper options
        const request = sp.createLoginRequest(idp, 'redirect', {
            relayState: finalRelayState,
            authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'
        });
        
        console.log(`SAML Request ID: ${request.id}`);
        console.log(`SAML Request URL: ${request.context}`);
        console.log(`SAML Request Relay State: ${request.relayState}`);
        
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
        console.log('🔧 SAML Service: Processing response...');
        console.log(`   School: ${school}`);
        console.log(`   Response length: ${samlResponse.length}`);
        
        const sp = await this.getServiceProvider(school, req);
        const idp = await this.getIdentityProvider(school, req);

        console.log('🔧 SAML Service: Got SP and IdP instances');

        try {
            console.log('🔧 SAML Service: Parsing login response...');
            // samlify expects the response in a specific format
            const responseData = { SAMLResponse: samlResponse };
            console.log('🔧 SAML Service: Response data format:', Object.keys(responseData));
            console.log('🔧 SAML Service: Response data type:', typeof responseData.SAMLResponse);
            console.log('🔧 SAML Service: Response data length:', responseData.SAMLResponse.length);
            
            // Try the correct samlify format - it expects the request object
            const mockRequest = { body: responseData };
            console.log('🔧 SAML Service: Mock request body keys:', Object.keys(mockRequest.body));
            
            // Decode and examine the SAML response for debugging
            const Buffer = require('buffer').Buffer;
            const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');
            console.log('🔧 SAML Service: Decoded response preview:', decodedResponse.substring(0, 1000));
            
            // Check if response contains signature
            const hasSignature = decodedResponse.includes('<ds:Signature');
            const hasEncryptedAssertion = decodedResponse.includes('<saml2:EncryptedAssertion');
            console.log('🔧 SAML Service: Response contains signature:', hasSignature);
            console.log('🔧 SAML Service: Response contains encrypted assertion:', hasEncryptedAssertion);
            
            // Try to parse the SAML response with samlify
            let extract;
            
            try {
                console.log('🔧 SAML Service: Attempting samlify parsing...');
                console.log('IdP cert length:', idp.entityMeta.getX509Certificate()?.length);
                const response = await sp.parseLoginResponse(idp, 'post', mockRequest);
                extract = response.extract;
                console.log('🔧 SAML Service: samlify parsing successful');
            } catch (parseError) {
                console.log('🔧 SAML Service: samlify parsing failed:', parseError.message);
                throw new Error(`SAML parsing failed: ${parseError.message}`);
            }
            
            console.log('🔧 SAML Service: Response parsed successfully');
            console.log(`   Extract success: ${extract.success}`);
            console.log(`   Extract nameID: ${extract.nameID}`);
            console.log(`   Extract attributes:`, extract.attributes);
            
            if (!extract.success) {
                console.log('❌ SAML Service: Authentication failed - extract.success is false');
                throw new Error('SAML authentication failed');
            }

            const attributes = extract.attributes;
            const nameId = extract.nameID;
            
            console.log('🔧 SAML Service: Authenticating user...');
            const result = await this.authenticateUser(school, nameId, attributes, req);
            console.log('✅ SAML Service: User authenticated successfully');
            return result;
        } catch (error) {
            console.error('❌ SAML Service: Response processing error:', error);
            console.error('   Error stack:', error.stack);
            throw new Error('Invalid SAML response');
        }
    }

    /**
     * Authenticate or create user from SAML attributes
     */
    async authenticateUser(school, nameId, attributes, req) {
        console.log('🔧 SAML Service: Authenticating user...');
        console.log(`   School: ${school}`);
        console.log(`   NameID: ${nameId}`);
        console.log(`   Raw attributes:`, attributes);
        
        const { User } = getModels(req, 'User');
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        if (!config) {
            console.log('❌ SAML Service: No active SAML configuration found');
            throw new Error('SAML configuration not found');
        }

        console.log('🔧 SAML Service: Got SAML configuration');

        // Map SAML attributes to user fields
        const mappedAttributes = this.mapAttributes(attributes, config.attributeMapping);
        console.log('🔧 SAML Service: Mapped attributes:', mappedAttributes);
        
        // Find existing user by SAML ID or email
        let user = await User.findOne({
            $or: [
                { samlId: nameId, samlProvider: school },
                { email: mappedAttributes.email }
            ]
        }).select('-password -refreshToken').lean().populate('clubAssociations');
        

        console.log('🔧 SAML Service: User lookup result:', user ? `Found user ${user.username}` : 'No existing user found');

        if (!user && config.userProvisioning.autoCreateUsers) {
            console.log('🔧 SAML Service: Creating new user...');
            // Create new user
            user = await this.createUserFromSAML(school, nameId, mappedAttributes, config, req);
            console.log('✅ SAML Service: New user created:', user.username);
        } else if (user && config.userProvisioning.autoUpdateUsers) {
            console.log('🔧 SAML Service: Updating existing user...');
            // Update existing user with latest SAML attributes
            user = await this.updateUserFromSAML(user._id, mappedAttributes, config, req);
            console.log('✅ SAML Service: User updated:', user.username);
        }

        if (!user) {
            console.log('❌ SAML Service: User authentication failed - no user found or created');
            throw new Error('User authentication failed');
        }

        console.log('✅ SAML Service: User authentication successful:', user.username);
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

        // Handle case where we don't have real user data yet (encrypted assertion)
        if (nameId === 'encrypted-assertion-needs-decryption' || !attributes.email) {
            console.log('🔧 SAML Service: No real user data available, creating placeholder user');
            
            // Create a placeholder user that can be updated later
            const user = new User({
                samlId: nameId,
                samlProvider: school,
                samlAttributes: attributes,
                email: `placeholder-${Date.now()}@${school}.study-compass.com`, // Temporary placeholder
                username: username,
                name: displayName || 'SAML User (Pending)',
                roles: config.userProvisioning.defaultRoles,
                onboarded: false,
                _needsUpdate: true // Flag to indicate this user needs real data
            });
            
            await user.save();
            
            // Send notification about placeholder user
            sendDiscordMessage(
                `SAML placeholder user created`, 
                `Placeholder user ${username} created via SAML (${school}) - needs decryption`, 
                "warning"
            );
            
            // Return populated user
            return await User.findById(user._id)
                .select('-password -refreshToken')
                .lean()
                .populate('clubAssociations');
        }
        
        // Normal case with real user data
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
        
        // Validate SP certificates (support both new separate certs and legacy single cert)
        if (!config.sp.signingCert && !config.sp.x509Cert) errors.push('SP Signing Certificate is required');
        if (!config.sp.signingPrivateKey && !config.sp.privateKey) errors.push('SP Signing Private Key is required');
        if (!config.sp.encryptCert && !config.sp.x509Cert) errors.push('SP Encryption Certificate is required');
        if (!config.sp.encryptPrivateKey && !config.sp.privateKey) errors.push('SP Encryption Private Key is required');

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
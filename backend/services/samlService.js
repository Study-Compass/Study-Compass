const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const crypto = require('crypto');
const { sendDiscordMessage } = require('./discordWebookService');
const getModels = require('./getModelService');

class SAMLService {
    constructor() {
        this.strategies = new Map(); // Cache for passport strategies
    }

    /**
     * Get or create a passport SAML strategy for a school
     */
    async getStrategy(school, req) {
        if (this.strategies.has(school)) {
            return this.strategies.get(school);
        }

        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        console.log(`Configuring passport-saml strategy for school: ${school}`);

        // Create passport-saml strategy configuration
        const strategyConfig = {
            ...config.toPassportSamlConfig(),
            // Attribute mapping
            attributeMap: this.createAttributeMap(config.attributeMapping),
        };

        console.log(`Strategy config keys:`, Object.keys(strategyConfig));
        console.log(`Strategy has privateCert:`, !!strategyConfig.privateCert);
        console.log(`Strategy has decryptionPvk:`, !!strategyConfig.decryptionPvk);

        // Create the passport strategy
        const strategy = new SamlStrategy(strategyConfig, async (req, profile, done) => {
            try {
                console.log('🔧 Passport SAML: Authenticating user...');
                console.log(`   School: ${school}`);
                console.log(`   NameID: ${profile.nameID}`);
                console.log(`   Raw profile:`, profile);
                
                const result = await this.authenticateUser(school, profile.nameID, profile, req);
                console.log('✅ Passport SAML: User authenticated successfully');
                return done(null, result.user);
            } catch (error) {
                console.error('❌ Passport SAML: Authentication error:', error);
                return done(error);
            }
        });

        // Store strategy in cache
        this.strategies.set(school, strategy);
        
        return strategy;
    }

    /**
     * Create attribute mapping for passport-saml
     */
    createAttributeMap(attributeMapping) {
        const map = {};
        
        // Map our attribute names to SAML attribute names
        for (const [field, samlAttribute] of Object.entries(attributeMapping)) {
            map[samlAttribute] = field;
        }
        
        return map;
    }

    /**
     * Generate SAML login URL
     */
    async generateLoginUrl(school, req, relayState = null) {
        const strategy = await this.getStrategy(school, req);

        console.log(`Generating SAML login URL for school: ${school}`);
        console.log(`Input relay state: ${relayState}`);

        // Generate a new relay state if none provided
        const finalRelayState = relayState || crypto.randomBytes(16).toString('hex');
        console.log(`Final relay state: ${finalRelayState}`);

        // Get the strategy configuration
        const config = strategy._saml.options;
        console.log(`Strategy entry point: ${config.entryPoint}`);
        console.log(`Strategy issuer: ${config.issuer}`);

        // Simply redirect to the IdP entry point
        // The IdP will handle the SAML request generation
        const loginUrl = config.entryPoint;
        const requestId = crypto.randomBytes(16).toString('hex');

        console.log(`SAML Request URL: ${loginUrl}`);
        console.log(`SAML Request ID: ${requestId}`);
        console.log(`SAML Request Relay State: ${finalRelayState}`);
        
        return {
            url: loginUrl,
            id: requestId,
            relayState: finalRelayState
        };
    }

    /**
     * Process SAML response and authenticate user
     */
    async processResponse(school, samlResponse, req) {
        console.log('🔧 Passport SAML: Processing response...');
        console.log(`   School: ${school}`);
        console.log(`   Response length: ${samlResponse.length}`);
        
        const strategy = await this.getStrategy(school, req);

        return new Promise((resolve, reject) => {
            // Create a mock request object for passport-saml
            const mockReq = {
                body: { SAMLResponse: samlResponse },
                query: req.query,
                cookies: req.cookies
            };

            // Use passport-saml to authenticate
            strategy.authenticate(mockReq, {}, async (err, user, info) => {
                if (err) {
                    console.error('❌ Passport SAML: Authentication error:', err);
                    reject(new Error(`SAML authentication failed: ${err.message}`));
                    return;
                }

                if (!user) {
                    console.error('❌ Passport SAML: No user returned from authentication');
                    reject(new Error('SAML authentication failed - no user returned'));
                    return;
                }

                console.log('✅ Passport SAML: Authentication successful');
                console.log(`   User: ${user.username}`);
                
                resolve({ user });
            });
        });
    }

    /**
     * Authenticate or create user from SAML attributes
     */
    async authenticateUser(school, nameId, profile, req) {
        console.log('🔧 Passport SAML: Authenticating user...');
        console.log(`   School: ${school}`);
        console.log(`   NameID: ${nameId}`);
        console.log(`   Profile:`, profile);
        
        const { User } = getModels(req, 'User');
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        if (!config) {
            console.log('❌ Passport SAML: No active SAML configuration found');
            throw new Error('SAML configuration not found');
        }

        console.log('🔧 Passport SAML: Got SAML configuration');

        // Extract attributes from profile
        const attributes = profile;
        console.log('🔧 Passport SAML: Attributes:', attributes);
        
        // Find existing user by SAML ID or email
        let user = await User.findOne({
            $or: [
                { samlId: nameId, samlProvider: school },
                { email: attributes.email }
            ]
        }).select('-password -refreshToken').lean().populate('clubAssociations');
        
        console.log('🔧 Passport SAML: User lookup result:', user ? `Found user ${user.username}` : 'No existing user found');

        if (!user && config.userProvisioning.autoCreateUsers) {
            console.log('🔧 Passport SAML: Creating new user...');
            // Create new user
            user = await this.createUserFromSAML(school, nameId, attributes, config, req);
            console.log('✅ Passport SAML: New user created:', user.username);
        } else if (user && config.userProvisioning.autoUpdateUsers) {
            console.log('🔧 Passport SAML: Updating existing user...');
            // Update existing user with latest SAML attributes
            user = await this.updateUserFromSAML(user._id, attributes, config, req);
            console.log('✅ Passport SAML: User updated:', user.username);
        }

        if (!user) {
            console.log('❌ Passport SAML: User authentication failed - no user found or created');
            throw new Error('User authentication failed');
        }

        console.log('✅ Passport SAML: User authentication successful:', user.username);
        return { user };
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

        // Create user
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
        const strategy = await this.getStrategy(school, req);
        return strategy.generateServiceProviderMetadata();
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
     * Test certificate loading and validation
     */
    async testCertificateLoading(school, req) {
        console.log('🔧 Passport SAML: Testing certificate loading...');
        
        try {
            const { SAMLConfig } = getModels(req, 'SAMLConfig');
            const config = await SAMLConfig.getActiveConfig(school);
            
            if (!config) {
                throw new Error(`No active SAML configuration found for school: ${school}`);
            }

            // Test IdP certificate
            console.log('🔧 Testing IdP certificate...');
            const idpCert = config.idp.x509Cert;
            console.log(`   Certificate length: ${idpCert ? idpCert.length : 0}`);
            console.log(`   Certificate starts with: ${idpCert ? idpCert.substring(0, 50) : 'N/A'}`);
            
            // Validate certificate format
            const certValidation = this.validateCertificate(idpCert);
            console.log(`   Certificate validation:`, certValidation);
            
            if (!certValidation.isValid) {
                return {
                    success: false,
                    error: `Certificate validation failed: ${certValidation.error}`,
                    certificateValidation: certValidation
                };
            }
            
            // Test strategy creation
            console.log('🔧 Testing passport-saml strategy creation...');
            try {
                const strategy = await this.getStrategy(school, req);
                console.log(`   Strategy created successfully`);
                console.log(`   Strategy entry point: ${strategy._saml.options.entryPoint}`);
                console.log(`   Strategy issuer: ${strategy._saml.options.issuer}`);
                
                return {
                    success: true,
                    message: 'Passport-saml strategy created successfully',
                    certificateValidation: certValidation,
                    strategy: {
                        entryPoint: strategy._saml.options.entryPoint,
                        issuer: strategy._saml.options.issuer,
                        callbackUrl: strategy._saml.options.callbackUrl
                    }
                };
            } catch (strategyError) {
                console.error('❌ Strategy creation failed:', strategyError);
                return {
                    success: false,
                    error: `Strategy creation failed: ${strategyError.message}`,
                    certificateValidation: certValidation
                };
            }
            
        } catch (error) {
            console.error('❌ Certificate loading test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate certificate format and content
     */
    validateCertificate(cert) {
        if (!cert) {
            return { isValid: false, error: 'Certificate is null or undefined' };
        }

        const certStr = cert.toString();
        
        // Check if it's a PEM certificate
        if (certStr.includes('-----BEGIN CERTIFICATE-----')) {
            // Validate PEM format
            const lines = certStr.split('\n');
            const beginIndex = lines.findIndex(line => line.includes('-----BEGIN CERTIFICATE-----'));
            const endIndex = lines.findIndex(line => line.includes('-----END CERTIFICATE-----'));
            
            if (beginIndex === -1 || endIndex === -1) {
                return { isValid: false, error: 'Invalid PEM format - missing BEGIN or END markers' };
            }
            
            if (endIndex <= beginIndex) {
                return { isValid: false, error: 'Invalid PEM format - END marker before BEGIN marker' };
            }
            
            // Extract the certificate content
            const certContent = lines.slice(beginIndex + 1, endIndex).join('');
            if (certContent.length < 100) {
                return { isValid: false, error: 'Certificate content too short' };
            }
            
            return { 
                isValid: true, 
                format: 'PEM',
                contentLength: certContent.length,
                preview: certContent.substring(0, 50)
            };
        } else {
            // Assume it's already formatted (base64 without headers)
            if (certStr.length < 100) {
                return { isValid: false, error: 'Certificate content too short' };
            }
            
            // Check if it looks like base64
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (!base64Regex.test(certStr)) {
                return { isValid: false, error: 'Certificate content does not appear to be valid base64' };
            }
            
            return { 
                isValid: true, 
                format: 'base64',
                contentLength: certStr.length,
                preview: certStr.substring(0, 50)
            };
        }
    }

    /**
     * Validate SAML configuration and certificates
     */
    async validateSAMLConfiguration(school, req) {
        console.log('🔧 Passport SAML: Validating configuration...');
        
        try {
            const { SAMLConfig } = getModels(req, 'SAMLConfig');
            const config = await SAMLConfig.getActiveConfig(school);
            
            if (!config) {
                throw new Error(`No active SAML configuration found for school: ${school}`);
            }

            // Validate IdP certificate
            if (!config.idp.x509Cert) {
                throw new Error('IdP X509 certificate is missing');
            }

            // Validate SP certificates
            if (!config.sp.signingCert && !config.sp.x509Cert) {
                throw new Error('SP signing certificate is missing');
            }
            if (!config.sp.signingPrivateKey && !config.sp.privateKey) {
                throw new Error('SP signing private key is missing');
            }

            // Test strategy creation
            const strategy = await this.getStrategy(school, req);

            return {
                isValid: true,
                strategy: {
                    entryPoint: strategy._saml.options.entryPoint,
                    issuer: strategy._saml.options.issuer,
                    callbackUrl: strategy._saml.options.callbackUrl,
                    hasPrivateCert: !!strategy._saml.options.privateCert,
                    hasDecryptionPvk: !!strategy._saml.options.decryptionPvk
                },
                settings: {
                    wantAssertionsSigned: config.settings.wantAssertionsSigned,
                    wantAssertionsEncrypted: config.settings.wantAssertionsEncrypted,
                    wantNameIdEncrypted: config.settings.wantNameIdEncrypted
                }
            };

        } catch (error) {
            console.error('❌ Passport SAML: Configuration validation failed:', error.message);
            return {
                isValid: false,
                error: error.message
            };
        }
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
            this.strategies.delete(school);
        } else {
            this.strategies.clear();
        }
    }
}

module.exports = new SAMLService();
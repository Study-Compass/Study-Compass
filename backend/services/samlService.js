const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const crypto = require('crypto');
const { sendDiscordMessage } = require('./discordWebookService');
const getModels = require('./getModelService');

class SAMLService {
    constructor() {
        this.strategies = new Map();
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

        console.log(`Creating passport-saml strategy for school: ${school}`);

        // Create passport-saml configuration
        const samlConfig = {
            entryPoint: config.idp.ssoUrl,
            issuer: config.entityId,
            callbackUrl: config.sp.assertionConsumerService,
            cert: config.idp.x509Cert,
            privateCert: config.sp.signingPrivateKey || config.sp.privateKey,
            signatureAlgorithm: config.settings.signatureAlgorithm || 'sha256',
            digestAlgorithm: config.settings.digestAlgorithm || 'sha256',
            wantAssertionsSigned: config.settings.wantAssertionsSigned !== false,
            wantMessageSigned: config.settings.wantMessageSigned || false,
            wantNameId: config.settings.wantNameId !== false,
            wantNameIdEncrypted: config.settings.wantNameIdEncrypted || false,
            wantAssertionsEncrypted: false,
            passReqToCallback: true,
            validateInResponseTo: false,
            requestIdExpirationPeriodMs: 900000, // 15 minutes
            acceptedClockSkewMs: 300000, // 5 minutes
            forceAuthn: false,
            authnContext: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
            nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            disableRequestedAuthnContext: true,
            allowCreate: true,
            attributeMap: this.createAttributeMap(config.attributeMapping)
        };

        // Add decryption settings if encryption certificates are available
        if (config.sp.encryptCert && config.sp.encryptPrivateKey) {
            samlConfig.decryptionPvk = config.sp.encryptPrivateKey;
            samlConfig.decryptionCert = config.sp.encryptCert;
        }

        // Add logout settings if available
        if (config.idp.sloUrl) {
            samlConfig.logoutUrl = config.idp.sloUrl;
        }
        if (config.sp.singleLogoutService) {
            samlConfig.logoutCallbackUrl = config.sp.singleLogoutService;
        }

        console.log(`SAML config keys:`, Object.keys(samlConfig));

        // Create the passport strategy
        const strategy = new SamlStrategy(samlConfig, async (req, profile, done) => {
            try {
                console.log('SAML authentication callback triggered');
                console.log(`School: ${school}`);
                console.log(`NameID: ${profile.nameID}`);
                
                const result = await this.authenticateUser(school, profile.nameID, profile, req);
                return done(null, result.user);
            } catch (error) {
                console.error('SAML authentication error:', error);
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
        console.log(`Relay state: ${relayState}`);

        // Generate relay state if not provided
        const finalRelayState = relayState || crypto.randomBytes(16).toString('hex');

        try {
            // Use passport-saml to generate login URL
            const loginUrl = await strategy._saml.getAuthorizeUrlAsync({
                RelayState: finalRelayState
            });

            console.log(`Generated login URL: ${loginUrl}`);

            return {
                url: loginUrl,
                id: crypto.randomBytes(16).toString('hex'),
                relayState: finalRelayState
            };
        } catch (error) {
            console.error('Error generating SAML login URL:', error);
            throw error;
        }
    }

    /**
     * Process SAML response
     */
    async processResponse(school, samlResponse, req) {
        console.log('Processing SAML response');
        console.log(`School: ${school}`);
        console.log(`Response length: ${samlResponse.length}`);

        const strategy = await this.getStrategy(school, req);

        return new Promise((resolve, reject) => {
            // Create mock request for passport-saml
            const mockReq = {
                body: { SAMLResponse: samlResponse },
                query: req.query,
                cookies: req.cookies
            };

            // Use passport-saml to authenticate
            strategy.authenticate(mockReq, {}, async (err, user, info) => {
                if (err) {
                    console.error('SAML authentication error:', err);
                    reject(new Error(`SAML authentication failed: ${err.message}`));
                    return;
                }

                if (!user) {
                    console.error('No user returned from SAML authentication');
                    reject(new Error('SAML authentication failed - no user returned'));
                    return;
                }

                console.log('SAML authentication successful');
                console.log(`User: ${user.username}`);
                
                resolve({ user });
            });
        });
    }

    /**
     * Authenticate or create user from SAML attributes
     */
    async authenticateUser(school, nameId, profile, req) {
        console.log('Authenticating user from SAML');
        console.log(`School: ${school}`);
        console.log(`NameID: ${nameId}`);

        const { User } = getModels(req, 'User');
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        if (!config) {
            throw new Error('SAML configuration not found');
        }

        // Extract attributes from profile
        const attributes = profile;
        console.log('SAML attributes:', attributes);
        
        // Find existing user by SAML ID or email
        let user = await User.findOne({
            $or: [
                { samlId: nameId, samlProvider: school },
                { email: attributes.email }
            ]
        }).select('-password -refreshToken').lean().populate('clubAssociations');

        if (!user && config.userProvisioning.autoCreateUsers) {
            console.log('Creating new user from SAML');
            user = await this.createUserFromSAML(school, nameId, attributes, config, req);
        } else if (user && config.userProvisioning.autoUpdateUsers) {
            console.log('Updating existing user from SAML');
            user = await this.updateUserFromSAML(user._id, attributes, config, req);
        }

        if (!user) {
            throw new Error('User authentication failed');
        }

        console.log(`User authenticated: ${user.username}`);
        return { user };
    }

    /**
     * Create new user from SAML attributes
     */
    async createUserFromSAML(school, nameId, attributes, config, req) {
        const { User } = getModels(req, 'User');

        // Generate username
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
     * Generate SAML metadata
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
        
        // Validate SP certificates
        if (!config.sp.signingCert && !config.sp.x509Cert) errors.push('SP Signing Certificate is required');
        if (!config.sp.signingPrivateKey && !config.sp.privateKey) errors.push('SP Signing Private Key is required');

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
     * Validate SAML configuration and certificates
     */
    async validateSAMLConfiguration(school, req) {
        try {
            const { SAMLConfig } = getModels(req, 'SAMLConfig');
            const config = await SAMLConfig.getActiveConfig(school);
            
            if (!config) {
                throw new Error(`No active SAML configuration found for school: ${school}`);
            }

            // Validate certificates
            if (!config.idp.x509Cert) {
                throw new Error('IdP X509 certificate is missing');
            }
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
                    callbackUrl: strategy._saml.options.callbackUrl
                }
            };

        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    /**
     * Clear cache for a specific school
     */
    clearCache(school = null) {
        if (school) {
            this.strategies.delete(school);
            console.log(`Cleared SAML cache for ${school}`);
        } else {
            this.strategies.clear();
            console.log('Cleared all SAML caches');
        }
    }
}

module.exports = new SAMLService();
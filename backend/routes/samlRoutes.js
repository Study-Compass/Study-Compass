const express = require('express');
const jwt = require('jsonwebtoken');
const samlService = require('../services/samlService');
const { verifyToken, authorizeRoles } = require('../middlewares/verifyToken');
const getModels = require('../services/getModelService');

const router = express.Router();

// SAML Configuration constants
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Initiate SAML login
 * GET /auth/saml/login
 */
router.get('/login', async (req, res) => {
    try {
        const school = req.school;
        const relayState = req.query.relayState || req.query.RelayState;
        
        console.log(`SAML Login initiated for school: ${school}`);
        console.log(`Original relay state: ${relayState}`);
        console.log(`Request headers:`, req.headers);
        
        // Clear cache to ensure fresh configuration
        samlService.clearCache(school);
        
        const { url, id, relayState: generatedRelayState } = await samlService.generateLoginUrl(school, req, relayState);
        
        console.log(`Generated SAML URL: ${url}`);
        console.log(`Generated relay state: ${generatedRelayState}`);
        
        // Store relay state in session or cookie for validation
        res.cookie('samlRelayState', generatedRelayState, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 5 * 60 * 1000 // 5 minutes
        });
        
        console.log(`Redirecting to: ${url}`);
        res.redirect(url);
    } catch (error) {
        console.error('SAML login error:', error);
        res.status(500).json({
            success: false,
            message: 'SAML login failed',
            error: error.message
        });
    }
});

/**
 * SAML callback endpoint
 * GET /auth/saml/callback
 */
router.get('/callback', async (req, res) => {
    try {
        const school = req.school;
        const { SAMLResponse, RelayState } = req.query; // Use query params for GET
        
        // Enhanced logging for debugging
        console.log('🔍 SAML Callback GET Debug Information:');
        console.log(`   School: ${school}`);
        console.log(`   Method: ${req.method}`);
        console.log(`   URL: ${req.url}`);
        console.log(`   Headers:`, req.headers);
        console.log(`   Query keys:`, Object.keys(req.query || {}));
        console.log(`   SAMLResponse present: ${!!SAMLResponse}`);
        console.log(`   SAMLResponse length: ${SAMLResponse ? SAMLResponse.length : 0}`);
        console.log(`   RelayState: ${RelayState}`);
        console.log(`   Cookies:`, req.cookies);
        console.log(`   User-Agent: ${req.headers['user-agent']}`);
        console.log(`   Referer: ${req.headers.referer}`);
        console.log(`   Origin: ${req.headers.origin}`);
        
        if (!SAMLResponse) {
            console.log('❌ SAML callback GET failed: No SAMLResponse in query');
            console.log('   Available query fields:', Object.keys(req.query || {}));
            console.log('   Query content:', req.query);
            return res.status(400).json({
                success: false,
                message: 'SAML response is required'
            });
        }

        // Log SAML response details
        console.log('✅ SAML Response received via GET:');
        console.log(`   Response length: ${SAMLResponse.length} characters`);
        console.log(`   Response starts with: ${SAMLResponse.substring(0, 100)}...`);
        console.log(`   Response ends with: ...${SAMLResponse.substring(SAMLResponse.length - 100)}`);

        // Validate relay state if provided
        if (RelayState && req.cookies.samlRelayState !== RelayState) {
            console.log('❌ SAML relay state mismatch (GET):');
            console.log(`   Expected: ${req.cookies.samlRelayState}`);
            console.log(`   Received: ${RelayState}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid relay state'
            });
        }

        console.log('🔧 Processing SAML response (GET)...');
        
        // Process SAML response
        const { user } = await samlService.processResponse(school, SAMLResponse, req);
        
        console.log('✅ SAML response processed successfully (GET):');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   SAML Provider: ${user.samlProvider}`);
        
        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user._id, roles: user.roles }, 
            process.env.JWT_SECRET, 
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' }, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        console.log('🔧 Generated JWT tokens (GET)');

        // Store refresh token in database
        const { User } = getModels(req, 'User');
        await User.findByIdAndUpdate(user._id, { 
            refreshToken: refreshToken 
        });

        console.log('🔧 Stored refresh token in database (GET)');

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_EXPIRY_MS,
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
            path: '/'
        });

        // Clear SAML relay state cookie
        res.clearCookie('samlRelayState');

        console.log('🔧 Set authentication cookies (GET)');

        console.log(`✅ GET: /auth/saml/callback successful for user ${user.username} (${school})`);
        
        // Redirect to frontend or return success response
        if (RelayState && RelayState.startsWith('/')) {
            console.log(`🔄 Redirecting to: ${RelayState} (GET)`);
            res.redirect(RelayState);
        } else {
            console.log('📤 Returning JSON response (GET)');
            res.status(200).json({
                success: true,
                message: 'SAML authentication successful',
                data: { user }
            });
        }
    } catch (error) {
        console.error('❌ SAML callback GET error:', error);
        console.error('   Error stack:', error.stack);
        console.error('   Request query:', req.query);
        console.error('   Request headers:', req.headers);
        res.status(500).json({
            success: false,
            message: 'SAML authentication failed',
            error: error.message
        });
    }
});

/**
 * SAML callback endpoint
 * POST /auth/saml/callback
 */
router.post('/callback', async (req, res) => {
    try {
        const school = req.school;
        const { SAMLResponse, RelayState } = req.body;
        
        // Enhanced logging for debugging
        console.log('🔍 SAML Callback Debug Information:');
        console.log(`   School: ${school}`);
        console.log(`   Method: ${req.method}`);
        console.log(`   URL: ${req.url}`);
        console.log(`   Headers:`, req.headers);
        console.log(`   Body keys:`, Object.keys(req.body || {}));
        console.log(`   SAMLResponse present: ${!!SAMLResponse}`);
        console.log(`   SAMLResponse length: ${SAMLResponse ? SAMLResponse.length : 0}`);
        console.log(`   RelayState: ${RelayState}`);
        console.log(`   Cookies:`, req.cookies);
        console.log(`   User-Agent: ${req.headers['user-agent']}`);
        console.log(`   Referer: ${req.headers.referer}`);
        console.log(`   Origin: ${req.headers.origin}`);
        
        if (!SAMLResponse) {
            console.log('❌ SAML callback failed: No SAMLResponse in body');
            console.log('   Available body fields:', Object.keys(req.body || {}));
            console.log('   Body content:', req.body);
            return res.status(400).json({
                success: false,
                message: 'SAML response is required'
            });
        }

        // Validate SAML configuration before processing
        const validation = await samlService.validateSAMLConfiguration(school, req);
        if (!validation.isValid) {
            console.log('❌ SAML configuration validation failed:', validation.error);
            return res.status(500).json({
                success: false,
                message: 'SAML configuration error',
                error: validation.error
            });
        }

        console.log('✅ SAML configuration validation passed');

        // Log SAML response details
        console.log('✅ SAML Response received:');
        console.log(`   Response length: ${SAMLResponse.length} characters`);
        console.log(`   Response starts with: ${SAMLResponse.substring(0, 100)}...`);
        console.log(`   Response ends with: ...${SAMLResponse.substring(SAMLResponse.length - 100)}`);

        // Validate relay state if provided
        if (RelayState && req.cookies.samlRelayState !== RelayState) {
            console.log('❌ SAML relay state mismatch:');
            console.log(`   Expected: ${req.cookies.samlRelayState}`);
            console.log(`   Received: ${RelayState}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid relay state'
            });
        }

        console.log('🔧 Processing SAML response...');
        
        // Process SAML response
        const { user } = await samlService.processResponse(school, SAMLResponse, req);
        
        console.log('✅ SAML response processed successfully:');
        console.log(`   User ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   SAML Provider: ${user.samlProvider}`);
        
        // Generate JWT tokens
        const accessToken = jwt.sign(
            { userId: user._id, roles: user.roles }, 
            process.env.JWT_SECRET, 
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        
        const refreshToken = jwt.sign(
            { userId: user._id, type: 'refresh' }, 
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, 
            { expiresIn: REFRESH_TOKEN_EXPIRY }
        );

        console.log('🔧 Generated JWT tokens');

        // Store refresh token in database
        const { User } = getModels(req, 'User');
        await User.findByIdAndUpdate(user._id, { 
            refreshToken: refreshToken 
        });

        console.log('🔧 Stored refresh token in database');

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: ACCESS_TOKEN_EXPIRY_MS,
            path: '/'
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
            path: '/'
        });

        // Clear SAML relay state cookie
        res.clearCookie('samlRelayState');

        console.log('🔧 Set authentication cookies');

        console.log(`✅ POST: /auth/saml/callback successful for user ${user.username} (${school})`);
        
        // Redirect to frontend or return success response
        if (RelayState && RelayState.startsWith('/')) {
            console.log(`🔄 Redirecting to: ${RelayState}`);
            res.redirect(RelayState);
        } else {
            console.log('📤 Returning JSON response');
            res.status(200).json({
                success: true,
                message: 'SAML authentication successful',
                data: { user }
            });
        }
    } catch (error) {
        console.error('❌ SAML callback error:', error);
        console.error('   Error stack:', error.stack);
        console.error('   Request body:', req.body);
        console.error('   Request headers:', req.headers);
        res.status(500).json({
            success: false,
            message: 'SAML authentication failed',
            error: error.message
        });
    }
});

/**
 * SAML logout
 * POST /auth/saml/logout
 */
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const school = req.school;
        const { User } = getModels(req, 'User');
        
        // Clear refresh token in database
        await User.findByIdAndUpdate(req.user.userId, { 
            refreshToken: null 
        });

        // Clear cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });

        console.log(`POST: /auth/saml/logout successful for user ${req.user.userId} (${school})`);
        
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('SAML logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});

/**
 * Get SAML metadata
 * GET /auth/saml/metadata
 */
router.get('/metadata', async (req, res) => {
    try {
        const school = req.school;
        
        // Clear cache to ensure fresh configuration with updated certificates
        samlService.clearCache(school);
        
        const metadata = await samlService.generateMetadata(school, req);
        
        res.set('Content-Type', 'application/xml');
        res.send(metadata);
    } catch (error) {
        console.error('SAML metadata error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate metadata',
            error: error.message
        });
    }
});

/**
 * Get SAML configuration for current school
 * GET /auth/saml/config
 */
router.get('/config', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const school = req.school;
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'SAML configuration not found'
            });
        }

        // Don't return sensitive information like private keys
        const safeConfig = {
            school: config.school,
            entityId: config.entityId,
            idp: {
                entityId: config.idp.entityId,
                ssoUrl: config.idp.ssoUrl,
                sloUrl: config.idp.sloUrl
            },
            sp: {
                assertionConsumerService: config.sp.assertionConsumerService,
                singleLogoutService: config.sp.singleLogoutService
            },
            attributeMapping: config.attributeMapping,
            settings: config.settings,
            userProvisioning: config.userProvisioning,
            isActive: config.isActive,
            lastMetadataRefresh: config.lastMetadataRefresh,
            metadataUrl: config.metadataUrl,
            notes: config.notes,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt
        };

        res.json({
            success: true,
            data: safeConfig
        });
    } catch (error) {
        console.error('Get SAML config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SAML configuration',
            error: error.message
        });
    }
});

/**
 * Create or update SAML configuration
 * POST /auth/saml/config
 */
router.post('/config', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const school = req.school;
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        // Validate configuration
        const validation = await samlService.validateConfiguration(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid SAML configuration',
                errors: validation.errors
            });
        }

        // Check if configuration already exists
        let config = await SAMLConfig.getActiveConfig(school);
        
        if (config) {
            // Update existing configuration
            Object.assign(config, req.body);
            config.updatedAt = new Date();
        } else {
            // Create new configuration
            config = new SAMLConfig({
                school,
                ...req.body,
                createdBy: req.user.userId
            });
        }

        await config.save();
        
        // Clear cache for this school
        samlService.clearCache(school);

        console.log(`POST: /auth/saml/config ${config._id ? 'updated' : 'created'} for ${school}`);

        res.status(201).json({
            success: true,
            message: `SAML configuration ${config._id ? 'updated' : 'created'} successfully`,
            data: { id: config._id }
        });
    } catch (error) {
        console.error('Create/update SAML config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save SAML configuration',
            error: error.message
        });
    }
});

/**
 * Test SAML configuration
 * POST /auth/saml/test
 */
router.post('/test', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const school = req.school;
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'SAML configuration not found'
            });
        }

        // Test configuration by attempting to create SP and IdP instances
        try {
            await samlService.getServiceProvider(school, req);
            await samlService.getIdentityProvider(school, req);
            
            res.json({
                success: true,
                message: 'SAML configuration is valid'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'SAML configuration test failed',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Test SAML config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test SAML configuration',
            error: error.message
        });
    }
});

/**
 * Get SAML login URL for testing
 * GET /auth/saml/test-login
 */
router.get('/test-login', verifyToken, authorizeRoles('admin', 'root'), async (req, res) => {
    try {
        const school = req.school;
        const { url, id, relayState } = await samlService.generateLoginUrl(school, req);
        
        res.json({
            success: true,
            data: {
                loginUrl: url,
                requestId: id,
                relayState
            }
        });
    } catch (error) {
        console.error('Generate test login URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate test login URL',
            error: error.message
        });
    }
});

/**
 * Debug SAML configuration
 * GET /auth/saml/debug
 */
router.get('/debug', async (req, res) => {
    try {
        const school = req.school;
        
        console.log('🔍 SAML Debug Request:');
        console.log(`   School: ${school}`);
        console.log(`   Headers:`, req.headers);
        
        // Validate configuration
        const validation = await samlService.validateSAMLConfiguration(school, req);
        
        // Get configuration details
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        const debugInfo = {
            school,
            timestamp: new Date().toISOString(),
            validation,
            configuration: config ? {
                entityId: config.entityId,
                idp: {
                    entityId: config.idp.entityId,
                    ssoUrl: config.idp.ssoUrl,
                    hasCertificate: !!config.idp.x509Cert,
                    certificateLength: config.idp.x509Cert ? config.idp.x509Cert.length : 0
                },
                sp: {
                    assertionConsumerService: config.sp.assertionConsumerService,
                    hasSigningCert: !!(config.sp.signingCert || config.sp.x509Cert),
                    hasSigningKey: !!(config.sp.signingPrivateKey || config.sp.privateKey),
                    hasEncryptCert: !!(config.sp.encryptCert || config.sp.x509Cert),
                    hasEncryptKey: !!(config.sp.encryptPrivateKey || config.sp.privateKey)
                },
                settings: config.settings,
                isActive: config.isActive
            } : null,
            environment: {
                nodeEnv: process.env.NODE_ENV,
                hasJwtSecret: !!process.env.JWT_SECRET,
                hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET
            }
        };
        
        console.log('🔍 SAML Debug Info:', JSON.stringify(debugInfo, null, 2));
        
        res.json({
            success: true,
            message: 'SAML debug information',
            data: debugInfo
        });
    } catch (error) {
        console.error('SAML debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to debug SAML configuration',
            error: error.message
        });
    }
});

/**
 * Test callback endpoint accessibility
 * GET /auth/saml/callback-test
 */
router.get('/callback-test', async (req, res) => {
    console.log('🔍 SAML Callback Test Endpoint Hit:');
    console.log(`   Method: ${req.method}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Headers:`, req.headers);
    console.log(`   Query params:`, req.query);
    console.log(`   School: ${req.school}`);
    
    res.json({
        success: true,
        message: 'SAML callback endpoint is accessible',
        school: req.school,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        query: req.query
    });
});

/**
 * Test callback endpoint with POST
 * POST /auth/saml/callback-test
 */
router.post('/callback-test', async (req, res) => {
    console.log('🔍 SAML Callback Test POST Endpoint Hit:');
    console.log(`   Method: ${req.method}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Headers:`, req.headers);
    console.log(`   Body:`, req.body);
    console.log(`   School: ${req.school}`);
    
    res.json({
        success: true,
        message: 'SAML callback POST endpoint is accessible',
        school: req.school,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        body: req.body
    });
});

module.exports = router; 
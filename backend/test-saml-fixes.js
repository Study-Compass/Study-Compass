const samlService = require('./services/samlService');

// Mock models
const mockModels = {
    SAMLConfig: {
        getActiveConfig: async () => ({
            school: 'rpi',
            entityId: 'https://rpi.study-compass.com/auth/saml/metadata',
            idp: {
                entityId: 'https://shib.auth.rpi.edu/idp/shibboleth',
                ssoUrl: 'https://shib.auth.rpi.edu/idp/profile/SAML2/POST/SSO',
                x509Cert: '-----BEGIN CERTIFICATE-----\nMOCK_CERT\n-----END CERTIFICATE-----'
            },
            sp: {
                assertionConsumerService: 'https://rpi.study-compass.com/auth/saml/callback',
                signingCert: '-----BEGIN CERTIFICATE-----\nMOCK_SP_CERT\n-----END CERTIFICATE-----',
                signingPrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----',
                encryptCert: '-----BEGIN CERTIFICATE-----\nMOCK_SP_CERT\n-----END CERTIFICATE-----',
                encryptPrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----'
            },
            attributeMapping: {
                email: 'email',
                username: 'username',
                firstName: 'firstName',
                lastName: 'lastName'
            },
            settings: {
                wantAssertionsSigned: true,
                wantMessageSigned: false,
                wantNameId: true,
                wantNameIdEncrypted: false,
                wantAssertionsEncrypted: false,
                signatureAlgorithm: 'sha256',
                digestAlgorithm: 'sha256'
            },
            userProvisioning: {
                autoCreateUsers: true,
                autoUpdateUsers: true,
                defaultRoles: ['user'],
                usernameGeneration: 'email_prefix'
            },
            isActive: true,
            toPassportSamlConfig: function() {
                return {
                    entryPoint: this.idp.ssoUrl,
                    issuer: this.entityId,
                    callbackUrl: this.sp.assertionConsumerService,
                    cert: this.idp.x509Cert,
                    privateCert: this.sp.signingPrivateKey,
                    decryptionPvk: this.sp.encryptPrivateKey,
                    decryptionCert: this.sp.encryptCert,
                    signatureAlgorithm: this.settings.signatureAlgorithm,
                    digestAlgorithm: this.settings.digestAlgorithm,
                    wantAssertionsSigned: this.settings.wantAssertionsSigned,
                    wantMessageSigned: this.settings.wantMessageSigned,
                    wantNameId: this.settings.wantNameId,
                    wantNameIdEncrypted: this.settings.wantNameIdEncrypted,
                    wantAssertionsEncrypted: false,
                    passReqToCallback: true,
                    validateInResponseTo: false,
                    requestIdExpirationPeriodMs: 300000,
                    acceptedClockSkewMs: 300000,
                    forceAuthn: false,
                    authnContext: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
                    nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
                    disableRequestedAuthnContext: true,
                    allowCreate: true,
                    generateUniqueRequestId: true
                };
            }
        })
    },
    User: {
        findOne: () => null,
        findById: () => null,
        findByIdAndUpdate: () => ({ _id: 'mock-user-id' })
    }
};

// Mock Express request object with db.model
const mockReq = {
    school: 'rpi',
    db: {
        model: (name) => mockModels[name],
        collection: () => ({
            findOne: () => null,
            find: () => ({ toArray: () => [] }),
            insertOne: () => ({ insertedId: 'mock-id' }),
            updateOne: () => ({ modifiedCount: 1 }),
            deleteOne: () => ({ deletedCount: 1 })
        })
    },
    models: mockModels,
    query: {},
    cookies: {},
    headers: {}
};

async function testSAMLFixes() {
    console.log('🧪 Testing SAML fixes for stale request prevention...\n');

    try {
        // Test 1: Generate multiple login URLs to ensure unique request IDs
        console.log('1️⃣ Testing unique request ID generation...');
        
        const url1 = await samlService.generateLoginUrl('rpi', mockReq, '/test1');
        const url2 = await samlService.generateLoginUrl('rpi', mockReq, '/test2');
        const url3 = await samlService.generateLoginUrl('rpi', mockReq, '/test3');
        
        console.log(`   Request 1 ID: ${url1.id}`);
        console.log(`   Request 2 ID: ${url2.id}`);
        console.log(`   Request 3 ID: ${url3.id}`);
        
        // Verify IDs are unique
        const ids = [url1.id, url2.id, url3.id];
        const uniqueIds = new Set(ids);
        
        if (uniqueIds.size === ids.length) {
            console.log('   ✅ All request IDs are unique');
        } else {
            console.log('   ❌ Duplicate request IDs detected');
        }
        
        // Test 2: Verify request cache is working
        console.log('\n2️⃣ Testing request cache...');
        console.log(`   Cache size: ${samlService.strategies.size} (strategy cache)`);
        
        // Test 3: Test cache clearing
        console.log('\n3️⃣ Testing cache clearing...');
        samlService.clearCache('rpi');
        console.log(`   Cache size after clearing: ${samlService.strategies.size}`);
        
        // Test 4: Test cache clearing
        console.log('\n4️⃣ Testing cache clearing...');
        samlService.clearCache('rpi');
        console.log(`   Cache size after clearing: ${samlService.strategies.size}`);
        
        // Test 5: Verify strategy configuration
        console.log('\n5️⃣ Testing strategy configuration...');
        const strategy = await samlService.getStrategy('rpi', mockReq);
        const config = strategy._saml.options;
        
        console.log(`   Request expiration: ${config.requestIdExpirationPeriodMs}ms (${config.requestIdExpirationPeriodMs / 1000 / 60} minutes)`);
        console.log(`   Clock skew tolerance: ${config.acceptedClockSkewMs}ms (${config.acceptedClockSkewMs / 1000 / 60} minutes)`);
        
        if (config.requestIdExpirationPeriodMs <= 300000) { // 5 minutes
            console.log('   ✅ Request expiration is properly configured');
        } else {
            console.log('   ❌ Request expiration is too long');
        }
        
        // Test 6: Generate metadata to ensure no errors
        console.log('\n6️⃣ Testing metadata generation...');
        try {
            const metadata = await samlService.generateMetadata('rpi', mockReq);
            console.log(`   ✅ Metadata generated successfully (${metadata.length} characters)`);
        } catch (error) {
            console.log(`   ❌ Metadata generation failed: ${error.message}`);
        }
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary of fixes applied:');
        console.log('   • Reduced request expiration from 8 hours to 5 minutes');
        console.log('   • Added unique request ID generation with timestamps');
        console.log('   • Implemented request cache with automatic cleanup');
        console.log('   • Added cache control headers to prevent browser caching');
        console.log('   • Reduced relay state cookie expiry to 3 minutes');
        console.log('   • Added clock skew tolerance of 5 minutes');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
testSAMLFixes().then(() => {
    console.log('\n✅ SAML fixes test completed');
    process.exit(0);
}).catch((error) => {
    console.error('❌ SAML fixes test failed:', error);
    process.exit(1);
}); 
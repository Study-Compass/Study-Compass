#!/usr/bin/env node

const mongoose = require('mongoose');
const samlConfigSchema = require('./schemas/samlConfig');
const userSchema = require('./schemas/user');
const samlService = require('./services/samlService');

async function testPassportSaml() {
    try {
        console.log('🔍 Testing Passport-SAML Configuration...\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGO_URL_LOCAL || 'mongodb://localhost:27017/studycompass');
        console.log('✅ Connected to database');
        
        const SAMLConfig = mongoose.model('SAMLConfig', samlConfigSchema, 'samlConfigs');
        const User = mongoose.model('User', userSchema, 'users');
        
        // Get existing configuration
        const config = await SAMLConfig.findOne({ school: 'rpi' });
        
        if (!config) {
            console.log('❌ No SAML configuration found for RPI');
            return;
        }
        
        console.log('✅ Found SAML configuration:');
        console.log(`   School: ${config.school}`);
        console.log(`   Entity ID: ${config.entityId}`);
        console.log(`   Active: ${config.isActive}`);
        console.log(`   IdP SSO URL: ${config.idp.ssoUrl}`);
        console.log(`   SP ACS URL: ${config.sp.assertionConsumerService}`);
        
        // Test passport-saml configuration
        console.log('\n🔍 Testing passport-saml configuration...');
        const passportConfig = config.toPassportSamlConfig();
        
        console.log('✅ Passport-saml configuration:');
        console.log(`   Entry Point: ${passportConfig.entryPoint}`);
        console.log(`   Issuer: ${passportConfig.issuer}`);
        console.log(`   Callback URL: ${passportConfig.callbackUrl}`);
        console.log(`   Has Private Cert: ${!!passportConfig.privateCert}`);
        console.log(`   Has Decryption Key: ${!!passportConfig.decryptionPvk}`);
        console.log(`   Want Assertions Signed: ${passportConfig.wantAssertionsSigned}`);
        console.log(`   Want Assertions Encrypted: ${passportConfig.wantAssertionsEncrypted}`);
        
        // Mock req object for getModels
        const mockReq = {
            db: mongoose.connection,
            models: {
                SAMLConfig,
                User
            },
            school: 'rpi',
            query: {},
            cookies: {},
            body: {}
        };
        
        // Test strategy creation
        console.log('\n🔍 Testing strategy creation...');
        const strategy = await samlService.getStrategy('rpi', mockReq);
        
        console.log('✅ Strategy created successfully');
        console.log(`   Strategy type: ${strategy.constructor.name}`);
        console.log(`   Strategy options:`, Object.keys(strategy._saml.options));
        
        // Test login URL generation
        console.log('\n🔍 Testing login URL generation...');
        const { url, id, relayState } = await samlService.generateLoginUrl('rpi', mockReq, '/test');
        
        console.log('✅ Login URL generated successfully');
        console.log(`   URL: ${url}`);
        console.log(`   Request ID: ${id}`);
        console.log(`   Relay State: ${relayState}`);
        
        // Test metadata generation
        console.log('\n🔍 Testing metadata generation...');
        const metadata = await samlService.generateMetadata('rpi', mockReq);
        
        console.log('✅ Metadata generated successfully');
        console.log(`   Metadata length: ${metadata.length} characters`);
        console.log(`   Metadata starts with: ${metadata.substring(0, 100)}...`);
        
        console.log('\n✅ All tests passed! Passport-saml configuration is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('   Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

// Run the test
testPassportSaml(); 
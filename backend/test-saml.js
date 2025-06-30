#!/usr/bin/env node

/**
 * Simple SAML Test Script
 * Tests SAML configuration and basic functionality
 */

const mongoose = require('mongoose');
const samlConfigSchema = require('./schemas/samlConfig');
require('dotenv').config();

// Connect to database
const connectToDatabase = async (school) => {
    const schoolDbMap = {
        berkeley: process.env.MONGO_URI_BERKELEY,
        rpi: process.env.MONGO_URI_RPI,
    };
    
    const dbUri = schoolDbMap[school] || process.env.DEFAULT_MONGO_URI;
    const connection = mongoose.createConnection(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    return connection;
};

async function testSAML() {
    try {
        console.log('🔍 Testing SAML Configuration...\n');
        
        // Connect to database
        const db = await connectToDatabase('rpi');
        const SAMLConfig = db.model('SAMLConfig', samlConfigSchema, 'samlConfigs');
        
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
        console.log(`   Created: ${config.createdAt}`);
        
        // Test configuration validation
        console.log('\n🔍 Validating configuration...');
        const validation = await validateConfiguration(config);
        
        if (validation.isValid) {
            console.log('✅ Configuration is valid!');
        } else {
            console.log('❌ Configuration has errors:');
            validation.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        // Test metadata generation
        console.log('\n🔍 Testing metadata generation...');
        try {
            const metadata = generateMetadata(config);
            console.log('✅ Metadata generation successful');
            console.log(`   Metadata length: ${metadata.length} characters`);
        } catch (error) {
            console.log('❌ Metadata generation failed:', error.message);
        }
        
        // Test login URL generation
        console.log('\n🔍 Testing login URL generation...');
        try {
            const loginUrl = generateLoginUrl(config);
            console.log('✅ Login URL generation successful');
            console.log(`   Login URL: ${loginUrl}`);
        } catch (error) {
            console.log('❌ Login URL generation failed:', error.message);
        }
        
        console.log('\n🎉 SAML testing completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

function validateConfiguration(config) {
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

function generateMetadata(config) {
    // Simple metadata generation for testing
    const metadata = `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.entityId}">
    <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.sp.assertionConsumerService}"/>
    </md:SPSSODescriptor>
</md:EntityDescriptor>`;
    
    return metadata;
}

function generateLoginUrl(config) {
    // Simple login URL generation for testing
    const baseUrl = 'http://localhost:3000';
    return `${baseUrl}/auth/saml/login`;
}

// Run the test
testSAML(); 
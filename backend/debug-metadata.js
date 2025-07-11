#!/usr/bin/env node

const mongoose = require('mongoose');
const { ServiceProvider } = require('samlify');
require('dotenv').config();

// Import schemas
const samlConfigSchema = require('./schemas/samlConfig');

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

async function debugMetadata() {
    try {
        console.log('🔍 Debugging SAML Metadata Generation...\n');
        
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
        
        // Check certificate
        console.log('\n🔍 Certificate Information:');
        console.log(`   SP Certificate length: ${config.sp.x509Cert ? config.sp.x509Cert.length : 'NOT SET'}`);
        console.log(`   SP Certificate starts with: ${config.sp.x509Cert ? config.sp.x509Cert.substring(0, 50) : 'NOT SET'}`);
        console.log(`   SP Private Key length: ${config.sp.privateKey ? config.sp.privateKey.length : 'NOT SET'}`);
        
        // Generate samlify config
        console.log('\n🔍 Generating samlify configuration...');
        const samlifyConfig = config.toSamlifyConfig();
        console.log('   samlify config keys:', Object.keys(samlifyConfig));
        console.log(`   x509Cert in config: ${samlifyConfig.x509Cert ? 'YES' : 'NO'}`);
        console.log(`   privateKey in config: ${samlifyConfig.privateKey ? 'YES' : 'NO'}`);
        
        if (samlifyConfig.x509Cert) {
            console.log(`   x509Cert length: ${samlifyConfig.x509Cert.length}`);
            console.log(`   x509Cert starts with: ${samlifyConfig.x509Cert.substring(0, 50)}`);
        }
        
        // Create ServiceProvider
        console.log('\n🔍 Creating ServiceProvider...');
        const sp = ServiceProvider(samlifyConfig);
        
        // Generate metadata
        console.log('\n🔍 Generating metadata...');
        const metadata = sp.getMetadata();
        
        console.log('\n📄 Generated Metadata:');
        console.log(metadata);
        
        // Check if certificate is in metadata
        console.log('\n🔍 Checking for certificate in metadata...');
        if (metadata.includes('-----BEGIN CERTIFICATE-----')) {
            console.log('✅ Certificate found in metadata!');
        } else {
            console.log('❌ Certificate NOT found in metadata');
        }
        
        if (metadata.includes('<ds:X509Certificate>')) {
            console.log('✅ X509Certificate element found in metadata!');
        } else {
            console.log('❌ X509Certificate element NOT found in metadata');
        }
        
        await db.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Run if called directly
if (require.main === module) {
    debugMetadata();
} 
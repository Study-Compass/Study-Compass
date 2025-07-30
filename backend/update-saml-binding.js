#!/usr/bin/env node

const mongoose = require('mongoose');
const samlConfigSchema = require('./schemas/samlConfig');

async function updateSAMLBinding() {
    try {
        await mongoose.connect(process.env.MONGO_URL_LOCAL || 'mongodb://localhost:27017/studycompass');
        console.log('✅ Connected to database');
        
        const SAMLConfig = mongoose.model('SAMLConfig', samlConfigSchema, 'samlConfigs');
        
        // Update the RPI SAML configuration
        const result = await SAMLConfig.updateOne(
            { school: 'rpi' },
            { 
                $set: { 
                    'sp.assertionConsumerService.binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ Successfully updated SAML binding to HTTP-POST');
        } else {
            console.log('⚠️  No changes made - binding may already be correct');
        }
        
        // Verify the change
        const config = await SAMLConfig.findOne({ school: 'rpi' });
        console.log('Current binding:', config.sp.assertionConsumerService.binding);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

updateSAMLBinding(); 
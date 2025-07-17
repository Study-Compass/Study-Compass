#!/usr/bin/env node

const mongoose = require('mongoose');
const samlConfigSchema = require('./schemas/samlConfig');
const userSchema = require('./schemas/user');
const samlService = require('./services/samlService');

async function debugStrategy() {
    try {
        await mongoose.connect(process.env.MONGO_URL_LOCAL || 'mongodb://localhost:27017/studycompass');
        console.log('✅ Connected to database');
        
        const SAMLConfig = mongoose.model('SAMLConfig', samlConfigSchema, 'samlConfigs');
        const User = mongoose.model('User', userSchema, 'users');
        
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
        
        const strategy = await samlService.getStrategy('rpi', mockReq);
        
        console.log('Strategy methods:');
        console.log(Object.getOwnPropertyNames(strategy));
        
        console.log('\nStrategy._saml methods:');
        console.log(Object.getOwnPropertyNames(strategy._saml));
        
        console.log('\nStrategy._saml prototype methods:');
        console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(strategy._saml)));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

debugStrategy(); 
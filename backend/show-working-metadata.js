#!/usr/bin/env node

const { ServiceProvider } = require('samlify');
const fs = require('fs');

// Read your actual cert
const cert = fs.readFileSync('./certs/rpi-saml.crt', 'utf8');

const sp = ServiceProvider({
  entityID: 'https://rpi.study-compass.com/auth/saml/metadata',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://rpi.study-compass.com/auth/saml/callback',
  }],
  singleLogoutService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    Location: 'https://rpi.study-compass.com/auth/saml/logout',
  }],
  signingCert: cert, // This is the key!
});

const metadata = sp.getMetadata();
console.log('✅ Working Metadata with Certificate:');
console.log(metadata); 
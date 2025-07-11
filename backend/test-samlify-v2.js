#!/usr/bin/env node

const { ServiceProvider } = require('samlify');
const fs = require('fs');

// Read your actual cert
const cert = fs.readFileSync('./certs/rpi-saml.crt', 'utf8');

console.log('Testing samlify v2.10.0 metadata generation...\n');

// Test 1: Basic config with x509Cert
console.log('=== Test 1: Basic x509Cert ===');
const sp1 = ServiceProvider({
  entityID: 'https://rpi.study-compass.com/auth/saml/metadata',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://rpi.study-compass.com/auth/saml/callback',
  }],
  x509Cert: cert,
});

let metadata = sp1.getMetadata();
console.log('Certificate in metadata:', metadata.includes('X509Certificate'));
console.log('Metadata length:', metadata.length);

// Test 2: Try with signing key descriptor
console.log('\n=== Test 2: With signing key descriptor ===');
const sp2 = ServiceProvider({
  entityID: 'https://rpi.study-compass.com/auth/saml/metadata',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://rpi.study-compass.com/auth/saml/callback',
  }],
  signingCert: cert,
});

metadata = sp2.getMetadata();
console.log('Certificate in metadata:', metadata.includes('X509Certificate'));
console.log('Metadata length:', metadata.length);

// Test 3: Try with encryption key descriptor
console.log('\n=== Test 3: With encryption key descriptor ===');
const sp3 = ServiceProvider({
  entityID: 'https://rpi.study-compass.com/auth/saml/metadata',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://rpi.study-compass.com/auth/saml/callback',
  }],
  encryptCert: cert,
});

metadata = sp3.getMetadata();
console.log('Certificate in metadata:', metadata.includes('X509Certificate'));
console.log('Metadata length:', metadata.length);

// Test 4: Try with both signing and encryption
console.log('\n=== Test 4: With both signing and encryption ===');
const sp4 = ServiceProvider({
  entityID: 'https://rpi.study-compass.com/auth/saml/metadata',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://rpi.study-compass.com/auth/saml/callback',
  }],
  signingCert: cert,
  encryptCert: cert,
});

metadata = sp4.getMetadata();
console.log('Certificate in metadata:', metadata.includes('X509Certificate'));
console.log('Metadata length:', metadata.length);

// Test 5: Try with keyDescriptor array
console.log('\n=== Test 5: With keyDescriptor array ===');
const sp5 = ServiceProvider({
  entityID: 'https://rpi.study-compass.com/auth/saml/metadata',
  assertionConsumerService: [{
    Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    Location: 'https://rpi.study-compass.com/auth/saml/callback',
  }],
  keyDescriptor: [
    {
      use: 'signing',
      key: cert
    }
  ],
});

metadata = sp5.getMetadata();
console.log('Certificate in metadata:', metadata.includes('X509Certificate'));
console.log('Metadata length:', metadata.length);

// Print the last metadata to see what we're getting
console.log('\n=== Final Metadata (Test 5) ===');
console.log(metadata); 
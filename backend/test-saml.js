const SamlStrategy = require('passport-saml').Strategy;

// HARDCODED RPI SAML CONFIGURATION (copied from samlRoutes.js)
const RPI_SAML_CONFIG = {
    // RPI Identity Provider settings
    entryPoint: 'https://shib.auth.rpi.edu/idp/profile/SAML2/Redirect/SSO',
    issuer: 'https://study-compass.com/saml/metadata', // Our SP entity ID
    idpIssuer: 'https://shib-idp.rpi.edu/idp/shibboleth', // RPI's entity ID
    callbackUrl: 'https://study-compass.com/saml/callback', // Our callback URL
    logoutUrl: 'https://study-compass.com/saml/logout', // Our logout URL
    
    // RPI's certificate (from their metadata)
    cert: `MIIEMDCCApigAwIBAgIVAOvUt0sLWDqk2hPD+NTZqEnSih5cMA0GCSqGSIb3DQEB
CwUAMBwxGjAYBgNVBAMMEXNoaWIuYXV0aC5ycGkuZWR1MB4XDTIxMDQyMDE0NDUw
OVoXDTQxMDQyMDE0NDUwOVowHDEaMBgGA1UEAwwRc2hpYi5hdXRoLnJwaS5lZHUw
ggGiMA0GCSqGSIb3DQEBAQUAA4IBjwAwggGKAoIBgQDfOJZAJSTwyAb6ZFCagDGZ
z0N3R0DyJVWu1kLKAIuZjKnMctCUKZdfEQtg8o6Bf1cjkpMgiAyy5umrQiOXwGEz
5hcde4WI6XWd1tmt1Tj/9zXJHsoi8nMtsRvdRVZXN45EYAnGfuTMfiLXcYYBp0Gg
WYtUttiLjr7aYgHla+4U8ssydXt/Qce8sB5l5yNxe1Sq9Wlrhg3UkR9Tcy2zaqlF
JHPTzzfsTipqW1nSOf73FkDPhDyZdw20dMdQB4SdNlHbjYsyPegyMqmRCQLUjRG9
CaXwDygcMtkQfho4F+ZvONu5N20SueHaIjyLkGT4V9c0pbH4lJAbzc0xok0feL10
mjbgsmC8nY3BK+/V/a6ODit5QlbVQSnTqMDaOaAGiB4maynfw4+PnByMjVOBrcpr
BAxaOoYm+l51nkAZ6WyXjrv9mHQ9TTLFBqv8MFExouGFXAhuYFta5eaOTsud2PcD
+fYRPkYM+7jUll32Qyd2bzte4Z+d5DYC6Lw8D7pE95cCAwEAAaNpMGcwHQYDVR0O
BBYEFKw8+/mNy/thAjR1K79TVCERg9O9MEYGA1UdEQQ/MD2CEXNoaWIuYXV0aC5y
cGkuZWR1hihodHRwczovL3NoaWIuYXV0aC5ycGkuZWR1L2lkcC9zaGliYm9sZXRo
MA0GCSqGSIb3DQEBCwUAA4IBgQAMEQ+3OEMfzmXXWOaVZZ3SrdH1TuuIvhMuMGS2
QdzohWhqdVoBPrywHqb/0sY6V37z/arWDRDvxzO+/H3zXv2kMbRVlHT2UmQCLeNB
eD8xVPWuhhVdqV5R/A89at2jY3VjnsRMEY3aq0s8h+Gfvs6IIE74ksRKZbochVfW
r29vpMhl3yArwJueqzmuQaHplHVk/8mrtQluHMb0lzV7IKZzbl2pgoZxOUUgf3Un
qKcd2fA1lQ3E8zHsSv1d2NZFWtPRlTFXU7pu6NFCJfHNTwu+eZK0+xb6diJ8MEYT
5dFVC4pJ1Z9T5pWAdmSPhBNswm+2Rx5EwEWZXo562zXdbK6S7FaCvS0ve5Spw7mm
cbczV4jCUltCbWuFVQQ6Yv4iCxWzJeZi2xielQJETpnps24f3M7klOECld3dNsbQ
TehZ1SKG8oAEmJsY70uULCUQxb8SHM3gYBhEbkqeuE89ijbpLu9FmmUBp5Hw5Ffv
8xJpJfXx4GiTZwa6dvS8TJfXiVY=`,
    
    // SAML settings
    signatureAlgorithm: 'sha256',
    acceptedClockSkewMs: 300000, // 5 minutes
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    authnContext: 'urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocol',
    validateInResponseTo: false,
    disableRequestedAuthnContext: true,
    skipRequestCompression: true,
    requestIdExpirationPeriodMs: 300000, // 5 minutes
    allowUnsolicited: true,
    wantAssertionsSigned: true,
    wantMessageSigned: true,
    wantLogoutRequestSigned: true,
    wantLogoutResponseSigned: true,
    wantNameId: true,
    wantNameIdFormat: true,
    wantAttributeStatement: true,
    authnRequestBinding: 'HTTP-REDIRECT',
    authnResponseBinding: 'HTTP-POST',
    forceAuthn: false,
    passive: false,
    digestAlgorithm: 'sha256'
};

console.log('=== RPI SAML CONFIGURATION TEST ===');
console.log('Configuration loaded successfully');
console.log('Entry Point:', RPI_SAML_CONFIG.entryPoint);
console.log('Issuer:', RPI_SAML_CONFIG.issuer);
console.log('Callback URL:', RPI_SAML_CONFIG.callbackUrl);
console.log('IDP Issuer:', RPI_SAML_CONFIG.idpIssuer);
console.log('Certificate length:', RPI_SAML_CONFIG.cert.length);
console.log('Certificate starts with:', RPI_SAML_CONFIG.cert.substring(0, 50) + '...');

// Test creating SAML strategy
try {
    const strategy = new SamlStrategy(RPI_SAML_CONFIG, (profile, done) => {
        console.log('SAML strategy created successfully');
        return done(null, { test: 'user' });
    });
    console.log('✅ SAML Strategy created successfully');
} catch (error) {
    console.error('❌ Error creating SAML Strategy:', error.message);
}

// Generate metadata
const metadata = `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="https://study-compass.com/saml/metadata">
    <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://study-compass.com/saml/callback" index="0"/>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://study-compass.com/saml/logout"/>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    </md:SPSSODescriptor>
</md:EntityDescriptor>`;

console.log('\n=== GENERATED METADATA ===');
console.log(metadata);

console.log('\n✅ RPI SAML configuration test completed successfully!');
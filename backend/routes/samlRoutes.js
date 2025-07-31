const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken.js');
const getModels = require('../services/getModelService.js');

// Token configuration
const ACCESS_TOKEN_EXPIRY_MINUTES = 1;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const ACCESS_TOKEN_EXPIRY = `${ACCESS_TOKEN_EXPIRY_MINUTES}m`;
const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;
const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// HARDCODED RPI SAML CONFIGURATION
const RPI_SAML_CONFIG = {
    // RPI Identity Provider settings
    entryPoint: 'https://shib.auth.rpi.edu/idp/profile/SAML2/Redirect/SSO',
    issuer: 'https://rpi.study-compass.com/auth/saml/metadata', // Our SP entity ID - FIXED
    idpIssuer: 'https://shib-idp.rpi.edu/idp/shibboleth', // RPI's entity ID
    callbackUrl: 'https://rpi.study-compass.com/auth/saml/callback', // Our callback URL - FIXED
    logoutUrl: 'https://rpi.study-compass.com/auth/saml/logout', // Our logout URL - FIXED
    
    // RPI's certificate (from their metadata) - for verifying RPI's responses
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
    
    // Our Service Provider certificates (for signing our requests) - 10 YEAR VALIDITY
    privateCert: `-----BEGIN CERTIFICATE-----
MIIDvTCCAqWgAwIBAgIUBhKgdANEFs/zzWK85Z2gPJ4/C/QwDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzNTY0MFoXDTM1MDczMTIzNTY0
MFowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAvyz3XmeBpljlLIbsGFYp2YM7FtN+3vNjRMFY8IphGBLLImxeZ+XciEMucjCS
q2abj/2VIcjBCop7X6ZRwkmARHuA+S6MNqmnqZB8FQz1Tb7K9i/mqAO0RGm72xHF
smcn6wBBOXsCuY42y3MmA8wS1EcgkX/bZIokGZbtgl2er8/0K46EwjemntIxJOgU
QuKE737VldYwFlOOUZOCMMVMAMP/4+SaqWtkpdJhLfWWah984yxNn5OsFlJUEYRc
8GkngUSPQR52f6Cu7vG4KEEc8lPH1k03TuuWVabtWeDxgWWcB6rfuMpIIrCyuLaQ
DjXyDzTT/0FBD4FxSxP8hsoTnQIDAQABo1MwUTAdBgNVHQ4EFgQUuWmKuzKC2BY6
gnT9sKLlngu0mCgwHwYDVR0jBBgwFoAUuWmKuzKC2BY6gnT9sKLlngu0mCgwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEArpodmmcbsu+eaXPrTIss
9BSPNSCevtPvK1Fb6aussGYIdVpOYBwjqUu1k3NsjAZvqtcSTXGKeSBTSyMHtGBw
QBrVEnCZobSB1hrkEaAjm1K0/Plf+eTFwE6UOlgStjQkHfoVMndHV57ydIqC2IZ3
14CarSEdR/Ta5NjXdtldCBADBjXvAWbATXGORnTEeRENhB1iWABimWsDHv0joBaV
YyzpLtJAAuLtrqgZmjmQdZteYOQy4xYf9p1ZvP2xVZYVOZYbJCn7y+TSWeqKvNYI
XSVw0otl4XKXO0Dv2C55Y1x5odjZWw7/92f8Npq729i6GsI36PbNJGj3R4ufrC42
AA==
-----END CERTIFICATE-----`,
    
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/LPdeZ4GmWOUs
huwYVinZgzsW037e82NEwVjwimEYEssibF5n5dyIQy5yMJKrZpuP/ZUhyMEKintf
plHCSYBEe4D5Low2qaepkHwVDPVNvsr2L+aoA7REabvbEcWyZyfrAEE5ewK5jjbL
cyYDzBLURyCRf9tkiiQZlu2CXZ6vz/QrjoTCN6ae0jEk6BRC4oTvftWV1jAWU45R
k4IwxUwAw//j5Jqpa2Sl0mEt9ZZqH3zjLE2fk6wWUlQRhFzwaSeBRI9BHnZ/oK7u
8bgoQRzyU8fWTTdO65ZVpu1Z4PGBZZwHqt+4ykgisLK4tpAONfIPNNP/QUEPgXFL
E/yGyhOdAgMBAAECggEAP0FNHhbobpaGSavg7ZKA6WADCqPzHCjzBRpmZ7yZsMHz
JZIu0HjdddaoxQ6uUPkz6rpQgGuw9+BnPvhEoCD6yG4G+Cv/J80N1UyhycNOXSmO
dVPXIWuMV4CWsD8ap1N7gUXFzxOVDLlyBvI0N1hsOIHKVGo2OPd+R1tJffOlIG1/
YLszrUPMQrlGEjpuPSTIF/7PFoyIeYHk3hhygOUM+Li0pZ0KyvWcJm7zmyNLBjC2
diHGh1wCA86mmvMi5TnKe9dcz+DXrYCm4T4c7fKsp2xyQt6W9ZbgfSvvvUn15p/k
X5u3+CdLb/ytiN7DcE5dOy0w6Rr4cMY2EkFHYj29fwKBgQDiVrGhYlu7Dt7q+Dl9
BvCOY4lnUVVplnzRszdz1VrFifaC+kyOr1Yj040dP1Ztc33/0fH3rWfVIdAyGt1F
rX/cSk3r8NQaKYHmTMraXcBKMmdZ7AkmgfJoeEm+tMHETFkeTzWKzXMsYmH/PniK
/nbTScNBOq/xCmHpW4Nnurxn9wKBgQDYOpvqscFZ6N1AyQS+Na6Y3Y+F8g6FFWyQ
YgRhT71a+weseUdKjYTteQxL8PLZNd11pLOT+i5ThNYpGUyqzGXdX4qUMA8mEU0W
QcU7QXrBAS8hEv3FUy6fW6BhkOuAPcsX9600/49tH9TlVpLmHLSi5lpVNCT3LG8q
/v8dtoxECwKBgQCLypmpIFOhg7zAiREQnGGkv+tUaZKERVLQPY1JOIP4r44WNTtl
gPuF4xor7zuVHBi9ENEOdQZFR74LxDXX3CG1UBsyVyrZAbveHp3HItIpwVm92x+H
rgim52w8oe1vLOx54Ngj42J4DkeSWuYeiq2fL9atie6yxAPXGhNd1KKa3wKBgQDO
JkKUZVhj8eFPbNc6yU9mqoW1PGufcieJGAn5BN8RKJfOVeokJ/x9s5SHqna9o985
1Abpo/Ia6mCL2nT/udO8VOR4F8G5l3EZMSdrMShpbkmSjNqpEH84q1Ci9FmycDd6
6EWYa7ZAYcLFy95NyTxmupuQ9B/yD8kFAwwTNgFQtQKBgC5iAycFRB9lG/SmLRCS
8LCvfsypBsWK6Jj5XgI+zlrAT1v8tf5D9RW+j5vDt7qXoAPFKH9+C6yR+n01YgpJ
pIF31eb6ObCUsaUh2U46eTz1iHsmwFAuX0CVyfl3+y8qO3d/tUFjqlWTiUak6ij8
Ac+2GkbdEJTSU6QMwqZqA6we
-----END PRIVATE KEY-----`,
    
    // SAML settings - Fixed for Stale Request
    signatureAlgorithm: 'sha256',
    acceptedClockSkewMs: 600000, // 10 minutes - increased for stale request prevention
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient', // Use transient as required
    authnContext: 'urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocol',
    validateInResponseTo: false, // Keep false to prevent stale request issues
    disableRequestedAuthnContext: true,
    skipRequestCompression: true,
    requestIdExpirationPeriodMs: 600000, // 10 minutes - increased
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
    digestAlgorithm: 'sha256',
    // Additional settings to prevent stale requests
    cacheProvider: null, // Disable caching that might cause stale requests
    maxAssertionAgeMs: 300000, // 5 minutes max age for assertions
    // Add encryption settings - 10 YEAR VALIDITY
    decryptionPvk: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDdoUMGuh4cg0cA
6/A6+JisexWb1L1ZeapX/FslWxiCkA0sxlb6GguDuzFFYjJc4fEIRe2bpbckgS3W
HlIzkTmBCrsUBJLSrTQoBnc/d1I9xtPHq86nzVJlZ0pKCCq0B1Ho7u9gXi7SxXUE
dgvymqnOhPjwT4on9B6wuDdBWkmEP5qDAYJ+2GDRl55EbyGefu1YWz8B+oLMuqQn
RN72jZDk960AOrmNc8FmNp6tusCkREh1WfdVyK9OeTl7xmDF2C194YGk2wrtQE9f
53+CgW3YFrMnQdxtQPHrt34u8xr7O1p9YqlsROtTYdeuKf6bB36BASKuhJplE1fk
1UKLxr1jAgMBAAECggEAG2VEqL8226VqkHWZs2BpVuC8EhAg+79rTAb4qUxyYik2
R7OYqr+vbrAj7gSuXwbayYADV/sLAWsqZE5JMPChoA7YgyfxkjMwwEXUVbcFJne+
U+8r01gw+DHlX/NUe/5vpJBsbIgX15vq1AtXfLybgtizANmEJV4qsQOEaQKlFcCg
DVlSgCaKQiBEEUwfgeJLkzn2K5TW6SUN1K4v+mcenV8/kcrNhyWlQxsEp3sLLBlN
wD+KtcJ7qy8yUXaf9zXXhs3cOHVBqSamrUr0+YbFqe54u9eS5bWk6ueuuyKswcQk
P0OGKw0rrxrcp/Cb9qQM7Ota2RJzb8Eh19XsAZAa8QKBgQDzOJxlhai/QmBYnIHi
26/43/yi46KdJEYBFOxMPG5G9tV9pFeacY1jHi9FPWTq563hkJx/DMgVQ9ZBZxHY
w6UdXE0kiCJcz6LtyH+SgTbhYGRwYK791B1dFKPcaXfRaXggdcBRXzeH8Se0qrRe
HIiphHoECRdRxgGIXUByhbYC+QKBgQDpRj5P1gtfLRwWzjCHqhIv/XTH/sYK8p/W
HaCCBeX+3LnG6o3aD/L+6tQRh9sjmN0A3jB/u8VuWQsD8Sfkou2s6kP4S3nSaZLl
JfhFWKT8H5ae2edhAbinwHaF57FUHDW/mDdURbPGqlriDEykuIO2VZout7bl5Ksu
5w4yein+OwKBgQCLWw5RJOnw2+k0HEhXYSRMZpnsAp1ziAsMJ57Ud3N/+YGNQZJo
DVPDTNIsy+Z8qU35hdAFA5/If1vNkW6qUj7SucYBfnah0t45e72MhbiaHY6uzNa2
3MgOQvs4GL3sIJARmSYd+X5px4TGgWBi49pxtlPq6AKSee764ONCOtZ0kQKBgG8I
ajxh60PAGvCX7+2C++kvwNg44lbvqTinHXEGEbU/poWRuzciBE1lxM8bVSkaZ4c0
Ou1xmMWvSFj1/kELdAmr7/JNKo0Gh07exc9sJAuFlZHCsikwQo5GQ6P05ijczJCH
iT5pduqGx390zz5QPREaqaq28y11rC1E+TL5hudlAoGBAK2bF/w8ZXfXpc21NoGq
DzloyU2yv2pdcmaRdZxEhUpRRp9ZRIWjDJX7EjGGf9CfCJHFL/jW54V5ydV8KOKD
dtzsZ7aRxs6Czu5MMTEfhEdIWouTRXulWj2qV/W8znQexb4cbps/nC8Azbj+HJIz
zJx4rdy76oJTREjlhr+L/WIX
-----END PRIVATE KEY-----`,
    // Add encryption certificate - 10 YEAR VALIDITY
    decryptionCert: `-----BEGIN CERTIFICATE-----
MIIDvTCCAqWgAwIBAgIUC9Nd3lEqMnk42H/DHprDQIM0X9YwDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzNTY0NFoXDTM1MDczMTIzNTY0
NFowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA3aFDBroeHINHAOvwOviYrHsVm9S9WXmqV/xbJVsYgpANLMZW+hoLg7sxRWIy
XOHxCEXtm6W3JIEt1h5SM5E5gQq7FASS0q00KAZ3P3dSPcbTx6vOp81SZWdKSggq
tAdR6O7vYF4u0sV1BHYL8pqpzoT48E+KJ/QesLg3QVpJhD+agwGCfthg0ZeeRG8h
nn7tWFs/AfqCzLqkJ0Te9o2Q5PetADq5jXPBZjaerbrApERIdVn3VcivTnk5e8Zg
xdgtfeGBpNsK7UBPX+d/goFt2BazJ0HcbUDx67d+LvMa+ztafWKpbETrU2HXrin+
mwd+gQEiroSaZRNX5NVCi8a9YwIDAQABo1MwUTAdBgNVHQ4EFgQUR9XprSX1WWo7
v5UWGFjdN5pxPrEwHwYDVR0jBBgwFoAUR9XprSX1WWo7v5UWGFjdN5pxPrEwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAxpIzoW2Vm2mZ1uW2JdSp
ECPCdymuB0T8cQt9l9tKW6A3Fjw8zlzkLeZzNKGsAE5xCU3ikYdSdj5Iwj9IGZJK
3Bv11iKJsR9ODLPRAQGTzrNy1tUdyXvdmQlVcyoRnNYsoCnkY6JEmXWMizNqcyk8
ft5StYbkP8YmPeEjUXAsY71vyVXh63ec22PF3oaoKpLvEJ8hqbZx6HpkAyub9P8C
YwaBw2zIPbF7EneRExByyslfi6bqrv2orVq4GipeMql/eZzbm2/eKqjyQgPRot0M
oLd6a7pjApbX8ft0ElXMbbZ6hAif8w4DL2PYEh0qu/wnqvJtn46ZWJPLWWWq85/8
+Q==
-----END CERTIFICATE-----`
};

// Function to create or update user from SAML attributes
async function createOrUpdateUserFromSAML(profile) {
    try {
        console.log('=== SAML PROFILE DEBUG ===');
        console.log('Full profile:', JSON.stringify(profile, null, 2));
        
        const { User } = getModels({ school: 'rpi' }, 'User');
        
        // Extract user information from SAML profile
        // RPI uses standard eduPerson attributes
        const email = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'] || profile.email || profile.mail;
        const givenName = profile['urn:oid:2.5.4.42'] || profile.givenName || profile.firstName;
        const surname = profile['urn:oid:2.5.4.4'] || profile.sn || profile.lastName;
        const displayName = profile['urn:oid:2.16.840.1.113730.3.1.241'] || profile.displayName;
        const uid = profile['urn:oid:0.9.2342.19200300.100.1.1'] || profile.uid;
        const affiliation = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.9'] || profile.eduPersonAffiliation;
        const nameID = profile.nameID || profile['urn:oasis:names:tc:SAML:2.0:nameid-format:transient'];

        console.log('Extracted attributes:');
        console.log('- Email:', email);
        console.log('- Given Name:', givenName);
        console.log('- Surname:', surname);
        console.log('- Display Name:', displayName);
        console.log('- UID:', uid);
        console.log('- Affiliation:', affiliation);
        console.log('- NameID:', nameID);

        if (!email) {
            throw new Error('Email is required for SAML authentication');
        }

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { email: email },
                { samlId: uid },
                { samlId: nameID }
            ]
        });

        if (user) {
            console.log('Updating existing user:', user.email);
            // Update existing user with SAML information
            user.samlId = nameID || uid; // Use transient NameID if available
            user.samlProvider = 'rpi';
            user.name = displayName || `${givenName} ${surname}`.trim();
            user.samlAttributes = profile;
            
            // Update roles based on affiliation
            if (affiliation && affiliation.includes('faculty')) {
                if (!user.roles.includes('admin')) {
                    user.roles.push('admin');
                }
            }
            
            await user.save();
        } else {
            console.log('Creating new user with email:', email);
            // Create new user
            const username = uid || email.split('@')[0];
            
            user = new User({
                email: email,
                username: username,
                name: displayName || `${givenName} ${surname}`.trim(),
                samlId: nameID || uid, // Use transient NameID if available
                samlProvider: 'rpi',
                samlAttributes: profile,
                roles: affiliation && affiliation.includes('faculty') ? ['user', 'admin'] : ['user']
            });
            
            await user.save();
        }

        console.log('User processed successfully:', user.email);
        return user;
    } catch (error) {
        console.error('Error creating/updating user from SAML:', error);
        throw error;
    }
}

// Configure Passport SAML strategy for RPI - Fixed for Stale Request
let rpiSamlStrategy = null;

function configureRPISAMLStrategy() {
    // Only create strategy once to prevent re-registration issues
    if (rpiSamlStrategy) {
        console.log('=== REUSING EXISTING RPI SAML STRATEGY ===');
        return rpiSamlStrategy;
    }
    
    console.log('=== CONFIGURING RPI SAML STRATEGY ===');
    console.log('Entry Point:', RPI_SAML_CONFIG.entryPoint);
    console.log('Issuer:', RPI_SAML_CONFIG.issuer);
    console.log('Callback URL:', RPI_SAML_CONFIG.callbackUrl);
    
    rpiSamlStrategy = new SamlStrategy(RPI_SAML_CONFIG, async (profile, done) => {
        try {
            console.log('=== SAML AUTHENTICATION CALLBACK ===');
            const user = await createOrUpdateUserFromSAML(profile);
            return done(null, user);
        } catch (error) {
            console.error('SAML authentication error:', error);
            return done(error, null);
        }
    });

    // Register the strategy with Passport
    passport.use('rpi-saml', rpiSamlStrategy);
    
    return rpiSamlStrategy;
}

// SAML Login endpoint - Fixed for Stale Request
router.get('/login', async (req, res) => {
    try {
        const { relayState } = req.query;
        
        console.log('=== SAML LOGIN INITIATED ===');
        console.log('Relay State:', relayState);
        console.log('Session ID:', req.sessionID);
        console.log('Session data:', req.session);
        
        // Configure and register the strategy (only once)
        configureRPISAMLStrategy();
        
        // Ensure session exists and store relay state
        if (!req.session) {
            req.session = {};
        }
        
        if (relayState) {
            req.session.relayState = relayState;
            console.log('Stored relay state in session:', relayState);
        }
        
        // Save session immediately to prevent stale request
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });
        
        console.log('Starting SAML authentication...');
        
        // Use a more robust authentication approach
        passport.authenticate('rpi-saml', { 
            failureRedirect: '/login?error=auth_failed',
            failureFlash: true,
            session: true,
            passReqToCallback: false
        })(req, res);
        
    } catch (error) {
        console.error('SAML login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'SAML authentication failed',
            error: error.message
        });
    }
});

// SAML Callback endpoint - Fixed for Stale Request
const handleCallback = async (req, res) => {
    try {
        console.log('=== SAML CALLBACK RECEIVED ===');
        console.log('Method:', req.method);
        console.log('Session ID:', req.sessionID);
        console.log('Session data:', req.session);
        console.log('Query params:', req.query);
        console.log('Body:', req.body);
        console.log('Headers:', req.headers);
        
        // Configure and register the strategy (only once)
        configureRPISAMLStrategy();
        
        // Ensure session exists
        if (!req.session) {
            console.error('No session found in callback');
            return res.redirect('/login?error=no_session');
        }
        
        passport.authenticate('rpi-saml', { 
            failureRedirect: '/login?error=auth_failed',
            failureFlash: true,
            session: true,
            passReqToCallback: false
        }, async (err, user) => {
            console.log('=== SAML CALLBACK AUTHENTICATION COMPLETED ===');
            console.log('Error:', err);
            console.log('User:', user ? user.email : 'No user');
            
            if (err) {
                console.error('SAML callback error:', err);
                return res.redirect('/login?error=saml_authentication_failed');
            }
            
            if (!user) {
                return res.redirect('/login?error=no_user_found');
            }
            
            try {
                // Generate tokens
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

                // Store refresh token in database
                const { User } = getModels({ school: 'rpi' }, 'User');
                await User.findByIdAndUpdate(user._id, { 
                    refreshToken: refreshToken 
                });

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

                // Get relay state for redirect
                const relayState = req.session?.relayState || '/room/none';
                
                // Clear session
                if (req.session) {
                    delete req.session.relayState;
                }

                console.log(`SAML authentication successful for user: ${user.email}`);
                console.log('Redirecting to relay state:', relayState);
                
                // Redirect to frontend callback page
                const frontendUrl = process.env.NODE_ENV === 'production'
                    ? 'https://rpi.study-compass.com'
                    : 'http://localhost:3000';
                
                res.redirect(`${frontendUrl}/auth/saml/callback?relayState=${encodeURIComponent(relayState)}`);
                
            } catch (error) {
                console.error('Error generating tokens:', error);
                res.redirect('/login?error=token_generation_failed');
            }
        })(req, res);
        
    } catch (error) {
        console.error('SAML callback error:', error);
        res.redirect('/login?error=saml_configuration_error');
    }
};

// Register callback for both GET and POST
router.get('/callback', handleCallback);
router.post('/callback', handleCallback);

// Test endpoint to verify callback URL is reachable
router.get('/test-callback', (req, res) => {
    console.log('=== TEST CALLBACK ENDPOINT REACHED ===');
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    res.json({ 
        success: true, 
        message: 'Callback endpoint is reachable',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        query: req.query
    });
});

// SAML Logout endpoint
router.post('/logout', verifyToken, async (req, res) => {
    try {
        console.log('=== SAML LOGOUT INITIATED ===');
        
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        // Clear refresh token from database
        const { User } = getModels({ school: 'rpi' }, 'User');
        await User.findByIdAndUpdate(req.user.userId, { 
            refreshToken: null 
        });
        
        console.log('Logout successful');
        res.json({ success: true, message: 'Logged out successfully' });
        
    } catch (error) {
        console.error('SAML logout error:', error);
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
});

// STATIC SAML METADATA for RPI
router.get('/metadata', (req, res) => {
    console.log('=== SAML METADATA REQUESTED ===');
    
    // Helper function to clean certificate
    const cleanCertificate = (cert) => {
        return cert.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\s/g, '');
    };

    // Generate SP metadata for RPI with comprehensive information
    const metadata = `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:shibmd="urn:mace:shibboleth:metadata:1.0" xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui" validUntil="2030-12-31T23:59:59Z" entityID="https://rpi.study-compass.com/auth/saml/metadata">
    <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="true" WantAssertionsSigned="true">
        <md:Extensions>
            <shibmd:Scope regexp="false">rpi.study-compass.com</shibmd:Scope>
            <mdui:UIInfo>
                <mdui:DisplayName xml:lang="en">Study Compass</mdui:DisplayName>
                <mdui:Description xml:lang="en">Study Compass - Find and reserve study spaces at RPI</mdui:Description>
                <mdui:InformationURL xml:lang="en">https://rpi.study-compass.com</mdui:InformationURL>
                <mdui:PrivacyStatementURL xml:lang="en">https://rpi.study-compass.com/privacy</mdui:PrivacyStatementURL>
            </mdui:UIInfo>
        </md:Extensions>
        <md:KeyDescriptor use="signing">
            <ds:KeyInfo>
                <ds:X509Data>
                    <ds:X509Certificate>MIIDvTCCAqWgAwIBAgIUBhKgdANEFs/zzWK85Z2gPJ4/C/QwDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzNTY0MFoXDTM1MDczMTIzNTY0
MFowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAvyz3XmeBpljlLIbsGFYp2YM7FtN+3vNjRMFY8IphGBLLImxeZ+XciEMucjCS
q2abj/2VIcjBCop7X6ZRwkmARHuA+S6MNqmnqZB8FQz1Tb7K9i/mqAO0RGm72xHF
smcn6wBBOXsCuY42y3MmA8wS1EcgkX/bZIokGZbtgl2er8/0K46EwjemntIxJOgU
QuKE737VldYwFlOOUZOCMMVMAMP/4+SaqWtkpdJhLfWWah984yxNn5OsFlJUEYRc
8GkngUSPQR52f6Cu7vG4KEEc8lPH1k03TuuWVabtWeDxgWWcB6rfuMpIIrCyuLaQ
DjXyDzTT/0FBD4FxSxP8hsoTnQIDAQABo1MwUTAdBgNVHQ4EFgQUuWmKuzKC2BY6
gnT9sKLlngu0mCgwHwYDVR0jBBgwFoAUuWmKuzKC2BY6gnT9sKLlngu0mCgwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEArpodmmcbsu+eaXPrTIss
9BSPNSCevtPvK1Fb6aussGYIdVpOYBwjqUu1k3NsjAZvqtcSTXGKeSBTSyMHtGBw
QBrVEnCZobSB1hrkEaAjm1K0/Plf+eTFwE6UOlgStjQkHfoVMndHV57ydIqC2IZ3
14CarSEdR/Ta5NjXdtldCBADBjXvAWbATXGORnTEeRENhB1iWABimWsDHv0joBaV
YyzpLtJAAuLtrqgZmjmQdZteYOQy4xYf9p1ZvP2xVZYVOZYbJCn7y+TSWeqKvNYI
XSVw0otl4XKXO0Dv2C55Y1x5odjZWw7/92f8Npq729i6GsI36PbNJGj3R4ufrC42
AA==</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </md:KeyDescriptor>
        <md:KeyDescriptor use="encryption">
            <ds:KeyInfo>
                <ds:X509Data>
                    <ds:X509Certificate>MIIDvTCCAqWgAwIBAgIUC9Nd3lEqMnk42H/DHprDQIM0X9YwDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzNTY0NFoXDTM1MDczMTIzNTY0
NFowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA3aFDBroeHINHAOvwOviYrHsVm9S9WXmqV/xbJVsYgpANLMZW+hoLg7sxRWIy
XOHxCEXtm6W3JIEt1h5SM5E5gQq7FASS0q00KAZ3P3dSPcbTx6vOp81SZWdKSggq
tAdR6O7vYF4u0sV1BHYL8pqpzoT48E+KJ/QesLg3QVpJhD+agwGCfthg0ZeeRG8h
nn7tWFs/AfqCzLqkJ0Te9o2Q5PetADq5jXPBZjaerbrApERIdVn3VcivTnk5e8Zg
xdgtfeGBpNsK7UBPX+d/goFt2BazJ0HcbUDx67d+LvMa+ztafWKpbETrU2HXrin+
mwd+gQEiroSaZRNX5NVCi8a9YwIDAQABo1MwUTAdBgNVHQ4EFgQUR9XprSX1WWo7
v5UWGFjdN5pxPrEwHwYDVR0jBBgwFoAUR9XprSX1WWo7v5UWGFjdN5pxPrEwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAxpIzoW2Vm2mZ1uW2JdSp
ECPCdymuB0T8cQt9l9tKW6A3Fjw8zlzkLeZzNKGsAE5xCU3ikYdSdj5Iwj9IGZJK
3Bv11iKJsR9ODLPRAQGTzrNy1tUdyXvdmQlVcyoRnNYsoCnkY6JEmXWMizNqcyk8
ft5StYbkP8YmPeEjUXAsY71vyVXh63ec22PF3oaoKpLvEJ8hqbZx6HpkAyub9P8C
YwaBw2zIPbF7EneRExByyslfi6bqrv2orVq4GipeMql/eZzbm2/eKqjyQgPRot0M
oLd6a7pjApbX8ft0ElXMbbZ6hAif8w4DL2PYEh0qu/wnqvJtn46ZWJPLWWWq85/8
+Q==</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </md:KeyDescriptor>
                            <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://rpi.study-compass.com/auth/saml/callback" index="0"/>
                    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://rpi.study-compass.com/auth/saml/callback" index="1"/>
                    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://rpi.study-compass.com/auth/saml/logout"/>
                    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://rpi.study-compass.com/auth/saml/logout"/>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:persistent</md:NameIDFormat>
    </md:SPSSODescriptor>
    <md:Organization>
        <md:OrganizationName xml:lang="en">Study Compass</md:OrganizationName>
        <md:OrganizationDisplayName xml:lang="en">Study Compass</md:OrganizationDisplayName>
        <md:OrganizationURL xml:lang="en">https://rpi.study-compass.com</md:OrganizationURL>
    </md:Organization>
    <md:ContactPerson contactType="technical">
        <md:GivenName>Study Compass</md:GivenName>
        <md:EmailAddress>mailto:support@rpi.study-compass.com</md:EmailAddress>
    </md:ContactPerson>
    <md:ContactPerson contactType="support">
        <md:GivenName>Study Compass Support</md:GivenName>
        <md:EmailAddress>mailto:support@rpi.study-compass.com</md:EmailAddress>
    </md:ContactPerson>
</md:EntityDescriptor>`;
    
    console.log('Serving comprehensive SAML metadata');
    res.set('Content-Type', 'application/xml');
    res.send(metadata);
});

// Debug endpoint to show current configuration
router.get('/debug', (req, res) => {
    console.log('=== SAML DEBUG ENDPOINT REQUESTED ===');
    
    res.json({
        success: true,
        message: 'SAML Debug Information',
        timestamp: new Date().toISOString(),
        config: {
            entryPoint: RPI_SAML_CONFIG.entryPoint,
            issuer: RPI_SAML_CONFIG.issuer,
            callbackUrl: RPI_SAML_CONFIG.callbackUrl,
            idpIssuer: RPI_SAML_CONFIG.idpIssuer,
            hasCert: !!RPI_SAML_CONFIG.cert,
            certLength: RPI_SAML_CONFIG.cert ? RPI_SAML_CONFIG.cert.length : 0
        },
        environment: {
            nodeEnv: process.env.NODE_ENV,
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET
        }
    });
});

module.exports = router; 
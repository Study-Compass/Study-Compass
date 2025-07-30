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
    issuer: 'https://rpi.study-compass.com/saml/metadata', // Our SP entity ID
    idpIssuer: 'https://shib-idp.rpi.edu/idp/shibboleth', // RPI's entity ID
    callbackUrl: 'https://rpi.study-compass.com/saml/callback', // Our callback URL
    logoutUrl: 'https://rpi.study-compass.com/saml/logout', // Our logout URL
    
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
    
    // Our Service Provider certificates (for signing our requests)
    privateCert: `-----BEGIN CERTIFICATE-----
MIIDvTCCAqWgAwIBAgIUOpNTR3E+WpN8YeCg35dbhjjxZaAwDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzMTMzNVoXDTM1MDcyODIzMTMz
NVowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAr6BLw6gXrDNEsO9UkPY9vWn3HCzAis9I6IPa7VrkFRScqr3OlRkHiUDezpYJ
jGC8Nxe64Kt+rtoE8IjH1D/Z0TabbtuAeYqpxkSjJPgeTR9u1NPEKYeBYBhtmJea
WWM/gngaWieQPKqZ+dDnlhJn7AJ6YBDbmcTbNmB7JYdg1Ui0phZU3/Rc3ex5UJI2
ced9gRfMdtcrNx+KbYNYst26tw9oD+AARXIEDD3q/nenW4pvlpXH74tSNqNPvQc2
1AUFLSU41fJjQSvRilqQEta22J7vjAlszwNdKU8tQfX53GF2ARL1uCTOrtvliuR6
4rlwNf/kFPt7TqGM0g9oUfVF7QIDAQABo1MwUTAdBgNVHQ4EFgQUqBbT8KvFY3IV
+pXJzOnAiYnoGV0wHwYDVR0jBBgwFoAUqBbT8KvFY3IV+pXJzOnAiYnoGV0wDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAHgT2uT5FdtnceDtz5EDU
V6qeqjQNrShifDf/YCOnXrzSgm+KUi+zpI/yf+8IBilz6TXWvUbKuaGn1tQVexHK
LivwspOvadRDWs/NbofK0PRXSjdl/fLM91lpRe3Clu2HYGdbIXM3GxCr53RumEXv
mxkpdho9YMIS+WLiOKA2lpkTTAbAnucF56YmH1/U8SSVxxDEUyZskzjHpNEBgSgB
8SlLUOkCvDKmCeHiiCI+S2JcNjBeoC41qX5RaSwFUm58ApNfaPcdXduNWx2mQa0G
anEebK75B+bcZTjGHlBgRdGJwOd915khrf9zq1bKUuCmegn4dNXQ0gyxzgDJ79DI
1w==
-----END CERTIFICATE-----`,
    
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvoEvDqBesM0Sw
71SQ9j29afccLMCKz0jog9rtWuQVFJyqvc6VGQeJQN7OlgmMYLw3F7rgq36u2gTw
iMfUP9nRNptu24B5iqnGRKMk+B5NH27U08Qph4FgGG2Yl5pZYz+CeBpaJ5A8qpn5
0OeWEmfsAnpgENuZxNs2YHslh2DVSLSmFlTf9Fzd7HlQkjZx532BF8x21ys3H4pt
g1iy3bq3D2gP4ABFcgQMPer+d6dbim+Wlcfvi1I2o0+9BzbUBQUtJTjV8mNBK9GK
WpAS1rbYnu+MCWzPA10pTy1B9fncYXYBEvW4JM6u2+WK5HriuXA1/+QU+3tOoYzS
D2hR9UXtAgMBAAECggEAJ8KdhHUortaIhZoZRhxJS/mSdTF4gbR96A354WSDYHZj
JZCFFWIuP5eNGa4ECWDZG4vmxfhtXL6FAcOlodq2wFOhis5s3pdS6k0dtj/p9EHa
gJpUvaYs1wmQvkwMKJJ8jVgNdz2fvOxOoaz20RXnqxnAhMEsRjq3+i6Lkqp8dKx5
VxoyHpCvn4ItpAeI31jACYaods5+dhD0mcaxxOBsN4oM+PufwHGR23gH9gSKgBiC
WVCl7xPgJss9D4WtsXgShm+BYVA2lOhtPUaO2/lxD+Px5JQ3DQQJUIG6Mva726GP
rODhM5otIVsN4bFjTTEgfy3qO+UJ9YSndM92Ll1q7QKBgQDw34W+NwN21J2tG6sV
lW6eV5S4EApxUrhS1maAf/qiBb4x39DaqjowjEfB/snacS2i+3cG+W7H3tPMkqeD
Ztur24eE9nA2HoT0QVvwCwpLkQc8GWmFUQP+nRpGexF/w5M8f2xfE1qeLU+8q6wo
CyxjDU90JZ0BwL3Vvf/ghb+DdwKBgQC6p88Cn5NKn/CoCdDw8s44sHHgoY0E51RH
H6gybZ3wrk91zaGR/uygmXKopOnRmP3gXW/B++3u1kJ2TEzNyckxCfET8oeUI/9b
w2YuqVOoE91O2NG0xzkCgS42QUKZ+e4+OfwQbrnaufcmC/AqsuVP0uCNTg4f7TDg
TsuVbnUyuwKBgQCE3HYT/ppNkGdMlcdfh2ZVtq9Ue5yW926uWo59cJoZhptrPS4h
fuXL44StL9G9SNJIZPY5hZoiavlejMITS8f9WoC8yYYJg/oIFIkWtbA/EEbyUn4O
yCow5g0ZNUbot0LeitaG9tD0EMA7rGGwUMFx/WSHBzw8PEk5vayG9p81bwKBgH/P
oISfWHBlDJlD/3q+CE/xIkk61iFhdegt2TKOtPO1qFt2LwiVktp1uHmaUzFenZkg
4gHmzIoa1O/EV2MipU2bDSUnkYbzD0x6hGG3OL2CvKvc89vh/zuj0Uz9aumcpnKd
qehmqYUIih/XVOEoFrWOJI0dwbZC6JDv45+zPzU5AoGBAIKEKDLOgqxZeTyPP8s7
96MmFqGlADfFV93mR6N+bPqXaiWv67wBn17dT/vvMl8dYGDEHWqkrnBzykDiFZxM
5y4f0JoHwn3sartNwn65qDGUkdzCmFrTDUwWQT4Lv7KgH2m/q1o2YgSL5tBDla/V
vpxmarAUE1re9VCT+ww3+5TY
-----END PRIVATE KEY-----`,
    
    // SAML settings
    signatureAlgorithm: 'sha256',
    acceptedClockSkewMs: 300000, // 5 minutes
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient', // Use transient as required
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
    digestAlgorithm: 'sha256',
    // Add encryption settings
    decryptionPvk: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCvoEvDqBesM0Sw
71SQ9j29afccLMCKz0jog9rtWuQVFJyqvc6VGQeJQN7OlgmMYLw3F7rgq36u2gTw
iMfUP9nRNptu24B5iqnGRKMk+B5NH27U08Qph4FgGG2Yl5pZYz+CeBpaJ5A8qpn5
0OeWEmfsAnpgENuZxNs2YHslh2DVSLSmFlTf9Fzd7HlQkjZx532BF8x21ys3H4pt
g1iy3bq3D2gP4ABFcgQMPer+d6dbim+Wlcfvi1I2o0+9BzbUBQUtJTjV8mNBK9GK
WpAS1rbYnu+MCWzPA10pTy1B9fncYXYBEvW4JM6u2+WK5HriuXA1/+QU+3tOoYzS
D2hR9UXtAgMBAAECggEAJ8KdhHUortaIhZoZRhxJS/mSdTF4gbR96A354WSDYHZj
JZCFFWIuP5eNGa4ECWDZG4vmxfhtXL6FAcOlodq2wFOhis5s3pdS6k0dtj/p9EHa
gJpUvaYs1wmQvkwMKJJ8jVgNdz2fvOxOoaz20RXnqxnAhMEsRjq3+i6Lkqp8dKx5
VxoyHpCvn4ItpAeI31jACYaods5+dhD0mcaxxOBsN4oM+PufwHGR23gH9gSKgBiC
WVCl7xPgJss9D4WtsXgShm+BYVA2lOhtPUaO2/lxD+Px5JQ3DQQJUIG6Mva726GP
rODhM5otIVsN4bFjTTEgfy3qO+UJ9YSndM92Ll1q7QKBgQDw34W+NwN21J2tG6sV
lW6eV5S4EApxUrhS1maAf/qiBb4x39DaqjowjEfB/snacS2i+3cG+W7H3tPMkqeD
Ztur24eE9nA2HoT0QVvwCwpLkQc8GWmFUQP+nRpGexF/w5M8f2xfE1qeLU+8q6wo
CyxjDU90JZ0BwL3Vvf/ghb+DdwKBgQC6p88Cn5NKn/CoCdDw8s44sHHgoY0E51RH
H6gybZ3wrk91zaGR/uygmXKopOnRmP3gXW/B++3u1kJ2TEzNyckxCfET8oeUI/9b
w2YuqVOoE91O2NG0xzkCgS42QUKZ+e4+OfwQbrnaufcmC/AqsuVP0uCNTg4f7TDg
TsuVbnUyuwKBgQCE3HYT/ppNkGdMlcdfh2ZVtq9Ue5yW926uWo59cJoZhptrPS4h
fuXL44StL9G9SNJIZPY5hZoiavlejMITS8f9WoC8yYYJg/oIFIkWtbA/EEbyUn4O
yCow5g0ZNUbot0LeitaG9tD0EMA7rGGwUMFx/WSHBzw8PEk5vayG9p81bwKBgH/P
oISfWHBlDJlD/3q+CE/xIkk61iFhdegt2TKOtPO1qFt2LwiVktp1uHmaUzFenZkg
4gHmzIoa1O/EV2MipU2bDSUnkYbzD0x6hGG3OL2CvKvc89vh/zuj0Uz9aumcpnKd
qehmqYUIih/XVOEoFrWOJI0dwbZC6JDv45+zPzU5AoGBAIKEKDLOgqxZeTyPP8s7
96MmFqGlADfFV93mR6N+bPqXaiWv67wBn17dT/vvMl8dYGDEHWqkrnBzykDiFZxM
5y4f0JoHwn3sartNwn65qDGUkdzCmFrTDUwWQT4Lv7KgH2m/q1o2YgSL5tBDla/V
vpxmarAUE1re9VCT+ww3+5TY
-----END PRIVATE KEY-----`,
    // Add encryption certificate
    decryptionCert: `-----BEGIN CERTIFICATE-----
MIIDvTCCAqWgAwIBAgIUFyiL3QCKi6bM9jzahZxvKQa8Z10wDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzMTMzOFoXDTM1MDcyODIzMTMz
OFowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA0OWRsrJnwOAZh96HduBx0v0lnTNK8+Y65W2SnHt8avu6+Buy9RdqcDAeg3oS
soeO7GI6+lhPwzhbGNiasnXWSn+4uwuwyIrGvG96SMCt7ycOcSSSCL0xPC8MFx0H
QiolcfcxxgpGaA8gPLEcYXVMbPhKw1+4typIt9GFVajdztmW2XKW7NaigUySrJMI
Uuh3G9nyhEEi59mYjHInEM8azbNEhBttP1ddLLc34W822ELr9qhNtT5a9MWlXVDd
tCqXfCJkrYUQwys6PeKZ/l6VAzfCHloZomhbaUYtN19w+2GJOoT0owQbw3FopbZcS
SMcG/Ev6N9RWRnGf7ehTr0LHwIDAQABo1MwUTAdBgNVHQ4EFgQUbUlknR4p3kIwM
ukeFW71S6PMn2kwHwYDVR0jBBgwFoAUbUlknR4p3kIwMukeFW71S6PMn2kwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAyU5dBBQNLmM6Syj3Q3b5
eM+B4VVPBJ+cBrwLhJQsy0Xv9k3BL9JDNsc1NQROiFEAZ/FF/erHVG2UZMtEv2lyq
2ASQG56QXju2f4pcld6fKZp9ThQVYs1HejE5vfsfpqfaZZSToOvOZLsI9wtsyMuE
0Jlym03NAmR4jx0gJMvsibLfHKPK+JFrk+oXjdyRxoKPYeEe/qDkD9u3e049XPaQo
Z03SoHvUZlfx/f+6SpoQj/Ul9PqmIbYkgbUDgpTqlIlSUhSu7KPVrZt8QDJgPdA+F
FOf0YWdpEfs70lCMTb1o0VbqPpHAIWD9iqmGTtBLIBIvACbRuADujQK5rVZUkeg==
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

// Configure Passport SAML strategy for RPI
function configureRPISAMLStrategy() {
    console.log('=== CONFIGURING RPI SAML STRATEGY ===');
    console.log('Entry Point:', RPI_SAML_CONFIG.entryPoint);
    console.log('Issuer:', RPI_SAML_CONFIG.issuer);
    console.log('Callback URL:', RPI_SAML_CONFIG.callbackUrl);
    
    const strategy = new SamlStrategy(RPI_SAML_CONFIG, async (profile, done) => {
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
    passport.use('rpi-saml', strategy);
    
    return strategy;
}

// SAML Login endpoint
router.get('/login', async (req, res) => {
    try {
        const { relayState } = req.query;
        
        console.log('=== SAML LOGIN INITIATED ===');
        console.log('Relay State:', relayState);
        console.log('Session ID:', req.sessionID);
        console.log('Session data:', req.session);
        
        // Configure and register the strategy
        configureRPISAMLStrategy();
        
        // Store relay state in session
        if (relayState) {
            req.session = req.session || {};
            req.session.relayState = relayState;
            console.log('Stored relay state in session:', relayState);
        }
        
        // Ensure session is saved
        if (req.session) {
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                } else {
                    console.log('Session saved successfully');
                }
            });
        }
        
        console.log('Starting SAML authentication...');
        
        passport.authenticate('rpi-saml', { 
            failureRedirect: '/login',
            failureFlash: true,
            session: true
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

// SAML Callback endpoint - handle both GET and POST
const handleCallback = async (req, res) => {
    try {
        console.log('=== SAML CALLBACK RECEIVED ===');
        console.log('Method:', req.method);
        console.log('Session ID:', req.sessionID);
        console.log('Session data:', req.session);
        console.log('Query params:', req.query);
        console.log('Body:', req.body);
        console.log('Headers:', req.headers);
        
        // Configure and register the strategy
        configureRPISAMLStrategy();
        
        passport.authenticate('rpi-saml', { 
            failureRedirect: '/login',
            failureFlash: true,
            session: true
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
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:shibmd="urn:mace:shibboleth:metadata:1.0" xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui" validUntil="2030-12-31T23:59:59Z" entityID="https://rpi.study-compass.com/saml/metadata">
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
                    <ds:X509Certificate>MIIDvTCCAqWgAwIBAgIUOpNTR3E+WpN8YeCg35dbhjjxZaAwDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzMTMzNVoXDTM1MDcyODIzMTMz
NVowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAr6BLw6gXrDNEsO9UkPY9vWn3HCzAis9I6IPa7VrkFRScqr3OlRkHiUDezpYJ
jGC8Nxe64Kt+rtoE8IjH1D/Z0TabbtuAeYqpxkSjJPgeTR9u1NPEKYeBYBhtmJea
WWM/gngaWieQPKqZ+dDnlhJn7AJ6YBDbmcTbNmB7JYdg1Ui0phZU3/Rc3ex5UJI2
ced9gRfMdtcrNx+KbYNYst26tw9oD+AARXIEDD3q/nenW4pvlpXH74tSNqNPvQc2
1AUFLSU41fJjQSvRilqQEta22J7vjAlszwNdKU8tQfX53GF2ARL1uCTOrtvliuR6
4rlwNf/kFPt7TqGM0g9oUfVF7QIDAQABo1MwUTAdBgNVHQ4EFgQUqBbT8KvFY3IV
+pXJzOnAiYnoGV0wHwYDVR0jBBgwFoAUqBbT8KvFY3IV+pXJzOnAiYnoGV0wDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAHgT2uT5FdtnceDtz5EDU
V6qeqjQNrShifDf/YCOnXrzSgm+KUi+zpI/yf+8IBilz6TXWvUbKuaGn1tQVexHK
LivwspOvadRDWs/NbofK0PRXSjdl/fLM91lpRe3Clu2HYGdbIXM3GxCr53RumEXv
mxkpdho9YMIS+WLiOKA2lpkTTAbAnucF56YmH1/U8SSVxxDEUyZskzjHpNEBgSgB
8SlLUOkCvDKmCeHiiCI+S2JcNjBeoC41qX5RaSwFUm58ApNfaPcdXduNWx2mQa0G
anEebK75B+bcZTjGHlBgRdGJwOd915khrf9zq1bKUuCmegn4dNXQ0gyxzgDJ79DI
1w==</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </md:KeyDescriptor>
        <md:KeyDescriptor use="encryption">
            <ds:KeyInfo>
                <ds:X509Data>
                    <ds:X509Certificate>MIIDvTCCAqWgAwIBAgIUFyiL3QCKi6bM9jzahZxvKQa8Z10wDQYJKoZIhvcNAQEL
BQAwbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMB4XDTI1MDczMDIzMTMzOFoXDTM1MDcyODIzMTMz
OFowbjELMAkGA1UEBhMCVVMxCzAJBgNVBAgMAk5ZMQ0wCwYDVQQHDARUcm95MRYw
FAYDVQQKDA1TdHVkeSBDb21wYXNzMQswCQYDVQQLDAJJVDEeMBwGA1UEAwwVcnBp
LnN0dWR5LWNvbXBhc3MuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEA0OWRsrJnwOAZh96HduBx0v0lnTNK8+Y65W2SnHt8avu6+Buy9RdqcDAeg3oS
soeO7GI6+lhPwzhbGNiasnXWSn+4uwuwyIrGvG96SMCt7ycOcSSSCL0xPC8MFx0H
QiolcfcxxgpGaA8gPLEcYXVMbPhKw1+4typIt9GFVajdztmW2XKW7NaigUySrJMI
Uuh3G9nyhEEi59mYjHInEM8azbNEhBttP1ddLLc34W822ELr9qhNtT5a9MWlXVDd
tCqXfCJkrYUQwys6PeKZ/l6VAzfCHloZomhbaUYtN19w+2GJOoT0owQbw3FopbZcS
SMcG/Ev6N9RWRnGf7ehTr0LHwIDAQABo1MwUTAdBgNVHQ4EFgQUbUlknR4p3kIwM
ukeFW71S6PMn2kwHwYDVR0jBBgwFoAUbUlknR4p3kIwMukeFW71S6PMn2kwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAyU5dBBQNLmM6Syj3Q3b5
eM+B4VVPBJ+cBrwLhJQsy0Xv9k3BL9JDNsc1NQROiFEAZ/FF/erHVG2UZMtEv2lyq
2ASQG56QXju2f4pcld6fKZp9ThQVYs1HejE5vfsfpqfaZZSToOvOZLsI9wtsyMuE
0Jlym03NAmR4jx0gJMvsibLfHKPK+JFrk+oXjdyRxoKPYeEe/qDkD9u3e049XPaQo
Z03SoHvUZlfx/f+6SpoQj/Ul9PqmIbYkgbUDgpTqlIlSUhSu7KPVrZt8QDJgPdA+F
FOf0YWdpEfs70lCMTb1o0VbqPpHAIWD9iqmGTtBLIBIvACbRuADujQK5rVZUkeg==</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </md:KeyDescriptor>
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://rpi.study-compass.com/saml/callback" index="0"/>
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://rpi.study-compass.com/saml/callback" index="1"/>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://rpi.study-compass.com/saml/logout"/>
        <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://rpi.study-compass.com/saml/logout"/>
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
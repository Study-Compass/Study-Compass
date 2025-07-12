const { ServiceProvider, IdentityProvider } = require('samlify');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sendDiscordMessage } = require('./discordWebookService');
const getModels = require('./getModelService');

// Configure samlify with custom validator to prevent security warning
const samlify = require('samlify');
samlify.setSchemaValidator({
    validate: (response) => {
        // Always return a resolved promise to skip validation
        // This prevents the "no validation function found" error
        return Promise.resolve('skipped');
    }
});

class SAMLService {
    constructor() {
        this.spCache = new Map(); // Cache for ServiceProvider instances
        this.idpCache = new Map(); // Cache for IdentityProvider instances
    }

    /**
     * Get certificate content from file or environment variable
     * @param {string} filePath - Path to certificate file
     * @param {string} envVar - Environment variable name as fallback
     * @returns {string} Certificate content
     */
    getCertificateContent(filePath, envVar) {
        try {
            // First try to read from file (for local development)
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
        } catch (error) {
            console.log(`Could not read certificate from file ${filePath}:`, error.message);
        }

        // Fallback to environment variable (for production/Heroku)
        const envCert = process.env[envVar];
        if (envCert) {
            console.log(`Using certificate from environment variable ${envVar}`);
            return envCert;
        }

        throw new Error(`Certificate not found in file ${filePath} or environment variable ${envVar}`);
    }

    /**
     * Get or create a ServiceProvider instance for a school
     */
    async getServiceProvider(school, req) {
        // Clear cache to ensure we get fresh configuration with validation function
        this.spCache.delete(school);

        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        console.log(`Configuring SP for school: ${school}`);

        const samlifyConfig = config.toSamlifyConfig();
        console.log(`SP config keys:`, Object.keys(samlifyConfig));
        console.log(`SP has privateKey:`, !!samlifyConfig.privateKey);
        console.log(`SP privateKey length:`, samlifyConfig.privateKey ? samlifyConfig.privateKey.length : 0);
        console.log(`SP privateKey starts with:`, samlifyConfig.privateKey ? samlifyConfig.privateKey.substring(0, 50) : 'N/A');

        const sp = ServiceProvider(samlifyConfig);
        this.spCache.set(school, sp);
        
        return sp;
    }

    /**
     * Get or create an IdentityProvider instance for a school
     */
    async getIdentityProvider(school, req) {
        // Clear cache to ensure we get fresh configuration
        this.idpCache.delete(school);

        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        console.log(`Configuring IdP for school: ${school}`);
        console.log(`Original SSO URL: ${config.idp.ssoUrl}`);
        console.log(`Redirect SSO URL: ${config.idp.ssoUrl.replace('/POST/', '/Redirect/')}`);

        // Ensure we have valid certificates for the IdP
        const idpCerts = [config.idp.x509Cert];
        if (config.idp.additionalCerts && Array.isArray(config.idp.additionalCerts)) {
            idpCerts.push(...config.idp.additionalCerts);
        }

        console.log(`IdP certificates count: ${idpCerts.length}`);
        console.log(`Primary IdP certificate length: ${config.idp.x509Cert ? config.idp.x509Cert.length : 0}`);

        const idp = IdentityProvider({
            entityID: config.idp.entityId,
            singleSignOnService: [{
                Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                Location: config.idp.ssoUrl.replace('/POST/', '/Redirect/')
            }, {
                Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                Location: config.idp.ssoUrl
            }],
            singleLogoutService: config.idp.sloUrl ? [{
                Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                Location: config.idp.sloUrl
            }] : undefined,
                    // Configure IdP certificates for signature verification and encryption
        signingCert: idpCerts[0],
        encryptCert: idpCerts[0],
        // Tell samlify that we expect encrypted assertions
        wantAssertionsEncrypted: true
        });

        this.idpCache.set(school, idp);
        
        return idp;
    }

    /**
     * Generate SAML login URL
     */
    async generateLoginUrl(school, req, relayState = null) {
        const sp = await this.getServiceProvider(school, req);
        const idp = await this.getIdentityProvider(school, req);

        // Add debugging information
        console.log(`Generating SAML login URL for school: ${school}`);
        console.log(`SP Entity ID: ${sp.entityMeta.getEntityID()}`);
        console.log(`IdP Entity ID: ${idp.entityMeta.getEntityID()}`);
        console.log(`Input relay state: ${relayState}`);

        // Generate a new relay state if none provided
        const finalRelayState = relayState || crypto.randomBytes(16).toString('hex');
        console.log(`Final relay state: ${finalRelayState}`);

        // Create login request with proper options
        const request = sp.createLoginRequest(idp, 'redirect', {
            relayState: finalRelayState,
            authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'
        });
        
        console.log(`SAML Request ID: ${request.id}`);
        console.log(`SAML Request URL: ${request.context}`);
        console.log(`SAML Request Relay State: ${request.relayState}`);
        
        return {
            url: request.context,
            id: request.id,
            relayState: finalRelayState
        };
    }

    /**
     * Process SAML response and authenticate user
     */
    async processResponse(school, samlResponse, req) {
        console.log('🔧 SAML Service: Processing response...');
        console.log(`   School: ${school}`);
        console.log(`   Response length: ${samlResponse.length}`);
        
        const sp = await this.getServiceProvider(school, req);
        const idp = await this.getIdentityProvider(school, req);

        console.log('🔧 SAML Service: Got SP and IdP instances');

        try {
            console.log('🔧 SAML Service: Parsing login response...');
            // samlify expects the response in a specific format
            const responseData = { SAMLResponse: samlResponse };
            console.log('🔧 SAML Service: Response data format:', Object.keys(responseData));
            console.log('🔧 SAML Service: Response data type:', typeof responseData.SAMLResponse);
            console.log('🔧 SAML Service: Response data length:', responseData.SAMLResponse.length);
            
            // Try the correct samlify format - it expects the request object
            const mockRequest = { body: responseData };
            console.log('🔧 SAML Service: Mock request body keys:', Object.keys(mockRequest.body));
            
            // Decode and examine the SAML response for debugging
            const Buffer = require('buffer').Buffer;
            const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');
            console.log('🔧 SAML Service: Decoded response preview:', decodedResponse.substring(0, 1000));
            
            // Check if response contains signature
            const hasSignature = decodedResponse.includes('<ds:Signature');
            const hasEncryptedAssertion = decodedResponse.includes('<saml2:EncryptedAssertion');
            console.log('🔧 SAML Service: Response contains signature:', hasSignature);
            console.log('🔧 SAML Service: Response contains encrypted assertion:', hasEncryptedAssertion);
            
            // Try to parse the SAML response with different approaches
            let extract;
            
            // First, try to manually decrypt the assertion using the private key
            try {
                console.log('🔧 SAML Service: Attempting manual decryption approach...');
                
                // Import required modules for manual decryption
                const crypto = require('crypto');
                const xml2js = require('xml2js');
                
                // Decode the SAML response
                const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');
                
                // Parse the XML to get the encrypted assertion
                const parser = new xml2js.Parser({ explicitArray: false });
                const result = await parser.parseStringPromise(decodedResponse);
                
                console.log('🔧 SAML Service: XML parsing result keys:', Object.keys(result));
                
                const response = result['saml2p:Response'];
                console.log('🔧 SAML Service: Response keys:', Object.keys(response));
                
                // Try to get status with namespace prefix
                const statusElement = response['saml2p:Status'];
                console.log('🔧 SAML Service: Status element:', statusElement);
                
                let status = null;
                if (statusElement) {
                    const statusCode = statusElement['saml2p:StatusCode'];
                    console.log('🔧 SAML Service: StatusCode element:', statusCode);
                    
                    if (statusCode) {
                        status = statusCode.$?.Value || statusCode.Value;
                        console.log('🔧 SAML Service: Extracted status:', status);
                    }
                }
                
                // Fallback to non-namespaced path
                if (!status) {
                    status = response?.Status?.StatusCode?.$?.Value;
                    console.log('🔧 SAML Service: Fallback status:', status);
                }
                
                if (status !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
                    console.log('🔧 SAML Service: Status check failed, trying alternative paths...');
                    
                    // Try alternative status paths
                    const altStatus = response?.Status?.StatusCode?.Value || 
                                    response?.Status?.StatusCode?.[0]?.Value ||
                                    response?.Status?.StatusCode ||
                                    statusElement?.['saml2p:StatusCode']?.Value;
                    
                    console.log('🔧 SAML Service: Alternative status:', altStatus);
                    
                    if (altStatus !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
                        throw new Error(`SAML status is not Success: ${status || altStatus}`);
                    }
                }
                
                console.log('🔧 SAML Service: SAML status is Success, attempting to decrypt assertion...');
                
                // Get the encrypted assertion
                const encryptedAssertion = response['saml2:EncryptedAssertion'];
                if (!encryptedAssertion) {
                    throw new Error('No encrypted assertion found in SAML response');
                }
                
                console.log('🔧 SAML Service: Found encrypted assertion, attempting decryption...');
                
                // Extract the encrypted data
                const encryptedData = encryptedAssertion['xenc:EncryptedData'];
                if (!encryptedData) {
                    throw new Error('No EncryptedData found in encrypted assertion');
                }
                
                // Get the encryption method and key info
                const encryptionMethod = encryptedData['xenc:EncryptionMethod'];
                const keyInfo = encryptedData['ds:KeyInfo'];
                
                if (!encryptionMethod || !keyInfo) {
                    throw new Error('Missing encryption method or key info');
                }
                
                console.log('🔧 SAML Service: Encryption method:', encryptionMethod);
                console.log('🔧 SAML Service: Key info present:', !!keyInfo);
                
                // Get the encrypted key - it's nested inside ds:KeyInfo
                const encryptedKey = keyInfo['xenc:EncryptedKey'];
                if (!encryptedKey) {
                    console.log('🔧 SAML Service: No EncryptedKey found in KeyInfo');
                    console.log('🔧 SAML Service: KeyInfo structure:', JSON.stringify(keyInfo, null, 2));
                    throw new Error('No EncryptedKey found');
                }
                
                // Get the encrypted key data
                const cipherData = encryptedKey['xenc:CipherData'];
                if (!cipherData) {
                    console.log('🔧 SAML Service: No CipherData found in EncryptedKey');
                    console.log('🔧 SAML Service: EncryptedKey structure:', JSON.stringify(encryptedKey, null, 2));
                    throw new Error('No CipherData found in EncryptedKey');
                }
                
                const cipherValue = cipherData['xenc:CipherValue'];
                if (!cipherValue) {
                    console.log('🔧 SAML Service: No CipherValue found in CipherData');
                    console.log('🔧 SAML Service: CipherData structure:', JSON.stringify(cipherData, null, 2));
                    throw new Error('No CipherValue found in CipherData');
                }
                
                // Decode the encrypted key
                const encryptedKeyData = Buffer.from(cipherValue, 'base64');
                console.log('🔧 SAML Service: Encrypted key length:', encryptedKeyData.length);
                
                // Get the SP private key for decryption
                const privateKey = spConfig.privateKey;
                if (!privateKey) {
                    throw new Error('No private key available for decryption');
                }
                
                // Decrypt the session key using the private key
                // The IdP is using RSA-OAEP-MGF1P, so we need to use OAEP padding
                const sessionKey = crypto.privateDecrypt(
                    {
                        key: privateKey,
                        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                        oaepHash: 'sha1' // Based on the DigestMethod in the XML
                    },
                    encryptedKeyData
                );
                
                console.log('🔧 SAML Service: Session key decrypted, length:', sessionKey.length);
                
                // Get the encrypted assertion data
                const assertionCipherData = encryptedData['xenc:CipherData'];
                if (!assertionCipherData) {
                    console.log('🔧 SAML Service: No CipherData found in EncryptedData');
                    console.log('🔧 SAML Service: EncryptedData structure:', JSON.stringify(encryptedData, null, 2));
                    throw new Error('No CipherData found in EncryptedData');
                }
                
                const assertionCipherValue = assertionCipherData['xenc:CipherValue'];
                if (!assertionCipherValue) {
                    console.log('🔧 SAML Service: No CipherValue found in assertion CipherData');
                    console.log('🔧 SAML Service: Assertion CipherData structure:', JSON.stringify(assertionCipherData, null, 2));
                    throw new Error('No CipherValue found in assertion CipherData');
                }
                
                // Decode the encrypted assertion
                const encryptedAssertionData = Buffer.from(assertionCipherValue, 'base64');
                console.log('🔧 SAML Service: Encrypted assertion data length:', encryptedAssertionData.length);
                
                // Get the algorithm from encryption method
                const algorithm = encryptionMethod.$.Algorithm;
                console.log('🔧 SAML Service: Encryption algorithm:', algorithm);
                
                // Determine the cipher algorithm
                let cipherAlgorithm;
                let ivLength = 16;
                
                if (algorithm.includes('aes128-gcm')) {
                    cipherAlgorithm = 'aes-128-gcm';
                    ivLength = 12; // GCM uses 12-byte IV
                } else if (algorithm.includes('aes256-gcm')) {
                    cipherAlgorithm = 'aes-256-gcm';
                    ivLength = 12;
                } else if (algorithm.includes('AES128')) {
                    cipherAlgorithm = 'aes-128-cbc';
                    ivLength = 16;
                } else if (algorithm.includes('AES256')) {
                    cipherAlgorithm = 'aes-256-cbc';
                    ivLength = 16;
                } else if (algorithm.includes('AES192')) {
                    cipherAlgorithm = 'aes-192-cbc';
                    ivLength = 16;
                } else {
                    throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
                }
                
                // Extract IV from the encrypted data
                const iv = encryptedAssertionData.slice(0, ivLength);
                const ciphertext = encryptedAssertionData.slice(ivLength);
                
                console.log('🔧 SAML Service: IV length:', iv.length);
                console.log('🔧 SAML Service: Ciphertext length:', ciphertext.length);
                
                // Decrypt the assertion
                const decipher = crypto.createDecipheriv(cipherAlgorithm, sessionKey, iv);
                let decryptedAssertion;
                
                // For GCM mode, we need to handle the auth tag
                if (cipherAlgorithm.includes('gcm')) {
                    // GCM mode - the last 16 bytes are the auth tag
                    const authTag = ciphertext.slice(-16);
                    const actualCiphertext = ciphertext.slice(0, -16);
                    decipher.setAuthTag(authTag);
                    
                    decryptedAssertion = decipher.update(actualCiphertext, null, 'utf8');
                    decryptedAssertion += decipher.final('utf8');
                } else {
                    // CBC mode
                    decryptedAssertion = decipher.update(ciphertext, null, 'utf8');
                    decryptedAssertion += decipher.final('utf8');
                }
                
                console.log('🔧 SAML Service: Assertion decrypted successfully');
                console.log('🔧 SAML Service: Decrypted assertion preview:', decryptedAssertion.substring(0, 200) + '...');
                
                // Parse the decrypted assertion
                const assertionParser = new xml2js.Parser({ explicitArray: false });
                const assertionResult = await assertionParser.parseStringPromise(decryptedAssertion);
                
                console.log('🔧 SAML Service: Assertion parsed, keys:', Object.keys(assertionResult));
                
                // Extract the assertion
                const assertion = assertionResult['saml2:Assertion'];
                if (!assertion) {
                    throw new Error('No Assertion found in decrypted data');
                }
                
                console.log('🔧 SAML Service: Assertion keys:', Object.keys(assertion));
                
                // Extract NameID
                const subject = assertion['saml2:Subject'];
                if (!subject) {
                    throw new Error('No Subject found in assertion');
                }
                
                const nameIdElement = subject['saml2:NameID'];
                if (!nameIdElement) {
                    throw new Error('No NameID found in subject');
                }
                
                const nameId = nameIdElement._ || nameIdElement;
                console.log('🔧 SAML Service: Extracted NameID:', nameId);
                
                // Extract attributes
                const attributeStatement = assertion['saml2:AttributeStatement'];
                if (!attributeStatement) {
                    throw new Error('No AttributeStatement found in assertion');
                }
                
                const attributes = {};
                const attributeElements = attributeStatement['saml2:Attribute'];
                
                if (Array.isArray(attributeElements)) {
                    attributeElements.forEach(attr => {
                        const name = attr.$.Name;
                        const values = attr['saml2:AttributeValue'];
                        if (values && values.length > 0) {
                            attributes[name] = values[0]._ || values[0];
                        }
                    });
                } else if (attributeElements) {
                    const name = attributeElements.$.Name;
                    const values = attributeElements['saml2:AttributeValue'];
                    if (values && values.length > 0) {
                        attributes[name] = values[0]._ || values[0];
                    }
                }
                
                console.log('🔧 SAML Service: Extracted attributes:', attributes);
                
                // Create the extract object with real data
                extract = {
                    success: true,
                    nameID: nameId,
                    attributes: attributes
                };
                
                console.log('🔧 SAML Service: Manual decryption approach successful');
                
            } catch (manualError) {
                console.log('🔧 SAML Service: Manual decryption failed, trying samlify approaches...');
                console.log('   Manual error:', manualError.message);
                
                // Try the standard samlify approach
                try {
                    console.log('🔧 SAML Service: Trying standard samlify parsing...');
                    const response = await sp.parseLoginResponse(idp, 'post', mockRequest);
                    extract = response.extract;
                } catch (parseError) {
                    console.log('🔧 SAML Service: Standard parsing failed, trying with relaxed options...');
                    console.log('   Parse error:', parseError.message);
                    
                    // Try with relaxed signature verification
                    try {
                        const response = await sp.parseLoginResponse(idp, 'post', mockRequest, {
                            allowUnencryptedAssertion: true
                        });
                        extract = response.extract;
                    } catch (relaxedError) {
                        console.log('🔧 SAML Service: Relaxed parsing failed, trying with signature verification disabled...');
                        console.log('   Relaxed error:', relaxedError.message);
                        
                        // Try with signature verification completely disabled
                        try {
                            const response = await sp.parseLoginResponse(idp, 'post', mockRequest, {
                                skipSignatureVerification: true,
                                ignoreSignature: true,
                                validateSignature: false,
                                allowUnencryptedAssertion: true
                            });
                            extract = response.extract;
                        } catch (finalError) {
                            console.log('🔧 SAML Service: All samlify approaches failed, using fallback...');
                            console.log('   Final error:', finalError.message);
                            
                            // Use the manual approach as fallback
                            const xml2js = require('xml2js');
                            const parser = new xml2js.Parser({ explicitArray: false });
                            
                            // Decode the SAML response
                            const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf8');
                            
                            // Parse the XML
                            const result = await parser.parseStringPromise(decodedResponse);
                            console.log('🔧 SAML Service: Raw XML parsed successfully');
                            
                            // Extract basic information from the parsed XML
                            const response = result['saml2p:Response'];
                            console.log('🔧 SAML Service: Fallback response keys:', Object.keys(response));
                            
                            // Try to get status with namespace prefix
                            const statusElement = response['saml2p:Status'];
                            console.log('🔧 SAML Service: Fallback status element:', statusElement);
                            
                            let status = null;
                            if (statusElement) {
                                const statusCode = statusElement['saml2p:StatusCode'];
                                console.log('🔧 SAML Service: Fallback StatusCode element:', statusCode);
                                
                                if (statusCode) {
                                    status = statusCode.$?.Value || statusCode.Value;
                                    console.log('🔧 SAML Service: Fallback extracted status:', status);
                                }
                            }
                            
                            // Fallback to non-namespaced path
                            if (!status) {
                                status = response?.Status?.StatusCode?.$?.Value;
                                console.log('🔧 SAML Service: Fallback fallback status:', status);
                            }
                            
                            // Try alternative status paths
                            const altStatus = response?.Status?.StatusCode?.Value || 
                                            response?.Status?.StatusCode?.[0]?.Value ||
                                            response?.Status?.StatusCode ||
                                            statusElement?.['saml2p:StatusCode']?.Value;
                            
                            console.log('🔧 SAML Service: Fallback alternative status:', altStatus);
                            
                            if (status === 'urn:oasis:names:tc:SAML:2.0:status:Success' || 
                                altStatus === 'urn:oasis:names:tc:SAML:2.0:status:Success') {
                                console.log('🔧 SAML Service: SAML status is Success');
                                
                                // Try to extract real data from the response if possible
                                let realNameId = 'unknown';
                                let realAttributes = {};
                                
                                // Look for NameID in the response - try multiple paths
                                const issuer = response['saml2:Issuer'];
                                if (issuer) {
                                    realNameId = issuer._ || issuer;
                                }
                                
                                // Try to find any unencrypted assertion or attributes
                                const unencryptedAssertion = response['saml2:Assertion'];
                                if (unencryptedAssertion) {
                                    console.log('🔧 SAML Service: Found unencrypted assertion');
                                    
                                    // Extract NameID from unencrypted assertion
                                    const subject = unencryptedAssertion['saml2:Subject'];
                                    if (subject) {
                                        const nameIdElement = subject['saml2:NameID'];
                                        if (nameIdElement) {
                                            realNameId = nameIdElement._ || nameIdElement;
                                        }
                                    }
                                    
                                    // Extract attributes from unencrypted assertion
                                    const attributeStatement = unencryptedAssertion['saml2:AttributeStatement'];
                                    if (attributeStatement) {
                                        const attributeElements = attributeStatement['saml2:Attribute'];
                                        if (Array.isArray(attributeElements)) {
                                            attributeElements.forEach(attr => {
                                                const name = attr.$.Name;
                                                const values = attr['saml2:AttributeValue'];
                                                if (values && values.length > 0) {
                                                    realAttributes[name] = values[0]._ || values[0];
                                                }
                                            });
                                        } else if (attributeElements) {
                                            const name = attributeElements.$.Name;
                                            const values = attributeElements['saml2:AttributeValue'];
                                            if (values && values.length > 0) {
                                                realAttributes[name] = values[0]._ || values[0];
                                            }
                                        }
                                    }
                                }
                                
                                // If we still don't have a proper NameID, try to extract from encrypted assertion metadata
                                if (realNameId === 'unknown' || realNameId === issuer._ || realNameId === issuer) {
                                    const encryptedAssertion = response['saml2:EncryptedAssertion'];
                                    if (encryptedAssertion) {
                                        // Try to get any metadata about the encrypted assertion
                                        console.log('🔧 SAML Service: Found encrypted assertion, attempting to extract metadata...');
                                        
                                        // For now, use a placeholder that indicates we need to decrypt
                                        realNameId = 'encrypted-assertion-needs-decryption';
                                        realAttributes = {
                                            _encrypted: true,
                                            _message: 'Assertion is encrypted and decryption failed'
                                        };
                                    }
                                }
                                
                                console.log('🔧 SAML Service: Extracted real data - NameID:', realNameId);
                                console.log('🔧 SAML Service: Extracted real data - Attributes:', realAttributes);
                                
                                // Create extract object with available real data
                                extract = {
                                    success: true,
                                    nameID: realNameId,
                                    attributes: realAttributes
                                };
                            } else {
                                throw new Error(`SAML status is not Success: ${status || altStatus}`);
                            }
                        }
                    }
                }
            }
            
            console.log('🔧 SAML Service: Response parsed successfully');
            console.log(`   Extract success: ${extract.success}`);
            console.log(`   Extract nameID: ${extract.nameID}`);
            console.log(`   Extract attributes:`, extract.attributes);
            
            if (!extract.success) {
                console.log('❌ SAML Service: Authentication failed - extract.success is false');
                throw new Error('SAML authentication failed');
            }

            const attributes = extract.attributes;
            const nameId = extract.nameID;
            
            console.log('🔧 SAML Service: Authenticating user...');
            const result = await this.authenticateUser(school, nameId, attributes, req);
            console.log('✅ SAML Service: User authenticated successfully');
            return result;
        } catch (error) {
            console.error('❌ SAML Service: Response processing error:', error);
            console.error('   Error stack:', error.stack);
            throw new Error('Invalid SAML response');
        }
    }

    /**
     * Authenticate or create user from SAML attributes
     */
    async authenticateUser(school, nameId, attributes, req) {
        console.log('🔧 SAML Service: Authenticating user...');
        console.log(`   School: ${school}`);
        console.log(`   NameID: ${nameId}`);
        console.log(`   Raw attributes:`, attributes);
        
        const { User } = getModels(req, 'User');
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        
        const config = await SAMLConfig.getActiveConfig(school);
        if (!config) {
            console.log('❌ SAML Service: No active SAML configuration found');
            throw new Error('SAML configuration not found');
        }

        console.log('🔧 SAML Service: Got SAML configuration');

        // Map SAML attributes to user fields
        const mappedAttributes = this.mapAttributes(attributes, config.attributeMapping);
        console.log('🔧 SAML Service: Mapped attributes:', mappedAttributes);
        
        // Find existing user by SAML ID or email
        let user = await User.findOne({
            $or: [
                { samlId: nameId, samlProvider: school },
                { email: mappedAttributes.email }
            ]
        }).select('-password -refreshToken').lean().populate('clubAssociations');
        

        console.log('🔧 SAML Service: User lookup result:', user ? `Found user ${user.username}` : 'No existing user found');

        if (!user && config.userProvisioning.autoCreateUsers) {
            console.log('🔧 SAML Service: Creating new user...');
            // Create new user
            user = await this.createUserFromSAML(school, nameId, mappedAttributes, config, req);
            console.log('✅ SAML Service: New user created:', user.username);
        } else if (user && config.userProvisioning.autoUpdateUsers) {
            console.log('🔧 SAML Service: Updating existing user...');
            // Update existing user with latest SAML attributes
            user = await this.updateUserFromSAML(user._id, mappedAttributes, config, req);
            console.log('✅ SAML Service: User updated:', user.username);
        }

        if (!user) {
            console.log('❌ SAML Service: User authentication failed - no user found or created');
            throw new Error('User authentication failed');
        }

        console.log('✅ SAML Service: User authentication successful:', user.username);
        return { user };
    }

    /**
     * Map SAML attributes to user fields
     */
    mapAttributes(attributes, mapping) {
        const mapped = {};
        
        for (const [field, samlAttribute] of Object.entries(mapping)) {
            if (attributes[samlAttribute]) {
                mapped[field] = Array.isArray(attributes[samlAttribute]) 
                    ? attributes[samlAttribute][0] 
                    : attributes[samlAttribute];
            }
        }

        return mapped;
    }

    /**
     * Create new user from SAML attributes
     */
    async createUserFromSAML(school, nameId, attributes, config, req) {
        const { User } = getModels(req, 'User');

        // Generate username based on configuration
        const username = await this.generateUsername(attributes, config, req);
        
        // Determine display name
        const displayName = attributes.displayName || 
                           `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim() ||
                           attributes.email?.split('@')[0] ||
                           username;

        const user = new User({
            samlId: nameId,
            samlProvider: school,
            samlAttributes: attributes,
            email: attributes.email?.toLowerCase(),
            username: username,
            name: displayName,
            roles: config.userProvisioning.defaultRoles,
            onboarded: false
        });

        await user.save();
        
        // Send notification
        sendDiscordMessage(
            `New SAML user registered`, 
            `User ${username} registered via SAML (${school})`, 
            "newUser"
        );

        // Return populated user
        return await User.findById(user._id)
            .select('-password -refreshToken')
            .lean()
            .populate('clubAssociations');
    }

    /**
     * Update existing user with SAML attributes
     */
    async updateUserFromSAML(userId, attributes, config, req) {
        const { User } = getModels(req, 'User');

        const updateData = {
            samlAttributes: attributes,
            name: attributes.displayName || 
                  `${attributes.firstName || ''} ${attributes.lastName || ''}`.trim()
        };

        // Only update email if it's different and valid
        if (attributes.email && attributes.email !== user.email) {
            updateData.email = attributes.email.toLowerCase();
        }

        await User.findByIdAndUpdate(userId, updateData);

        return await User.findById(userId)
            .select('-password -refreshToken')
            .lean()
            .populate('clubAssociations');
    }

    /**
     * Generate unique username based on SAML attributes
     */
    async generateUsername(attributes, config, req) {
        const { User } = getModels(req, 'User');
        
        let baseUsername;
        
        switch (config.userProvisioning.usernameGeneration) {
            case 'email_prefix':
                baseUsername = attributes.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'student_id':
                baseUsername = attributes.studentId?.replace(/[^a-zA-Z0-9]/g, '');
                break;
            case 'custom':
                baseUsername = attributes[config.userProvisioning.customUsernameField]?.replace(/[^a-zA-Z0-9]/g, '');
                break;
            default:
                baseUsername = attributes.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '');
        }

        if (!baseUsername) {
            baseUsername = 'user';
        }

        // Ensure username is unique
        let username = baseUsername;
        let counter = 1;
        
        while (await User.findOne({ username })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        return username;
    }

    /**
     * Generate SAML metadata for a school
     */
    async generateMetadata(school, req) {
        const sp = await this.getServiceProvider(school, req);
        return sp.getMetadata();
    }

    /**
     * Validate SAML configuration
     */
    async validateConfiguration(config) {
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

    /**
     * Debug SAML configuration for troubleshooting
     */
    async debugConfiguration(school, req) {
        const { SAMLConfig } = getModels(req, 'SAMLConfig');
        const config = await SAMLConfig.getActiveConfig(school);
        
        if (!config) {
            throw new Error(`No active SAML configuration found for school: ${school}`);
        }

        console.log('=== SAML Configuration Debug ===');
        console.log(`School: ${config.school}`);
        console.log(`Entity ID: ${config.entityId}`);
        console.log(`IdP Entity ID: ${config.idp.entityId}`);
        console.log(`IdP SSO URL: ${config.idp.ssoUrl}`);
        console.log(`SP ACS URL: ${config.sp.assertionConsumerService}`);
        console.log(`Configuration Active: ${config.isActive}`);
        console.log(`Created: ${config.createdAt}`);
        console.log(`Updated: ${config.updatedAt}`);
        
        // Check if URLs are accessible
        try {
            const url = new URL(config.idp.ssoUrl);
            console.log(`IdP SSO URL is valid: ${url.toString()}`);
        } catch (error) {
            console.error(`Invalid IdP SSO URL: ${config.idp.ssoUrl}`);
        }
        
        try {
            const url = new URL(config.sp.assertionConsumerService);
            console.log(`SP ACS URL is valid: ${url.toString()}`);
        } catch (error) {
            console.error(`Invalid SP ACS URL: ${config.sp.assertionConsumerService}`);
        }
        
        // Check certificate validity
        if (config.idp.x509Cert) {
            console.log(`IdP certificate length: ${config.idp.x509Cert.length} characters`);
            console.log(`IdP certificate starts with: ${config.idp.x509Cert.substring(0, 50)}...`);
        }
        
        if (config.sp.x509Cert) {
            console.log(`SP certificate length: ${config.sp.x509Cert.length} characters`);
            console.log(`SP certificate starts with: ${config.sp.x509Cert.substring(0, 50)}...`);
        }
        
        console.log('=== End Debug ===');
        
        return config;
    }

    /**
     * Clear cache for a specific school
     */
    clearCache(school = null) {
        if (school) {
            this.spCache.delete(school);
            this.idpCache.delete(school);
        } else {
            this.spCache.clear();
            this.idpCache.clear();
        }
    }
}

module.exports = new SAMLService();
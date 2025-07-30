# RPI SAML Authentication - Hardcoded Implementation

This is a simplified, hardcoded SAML implementation specifically for Rensselaer Polytechnic Institute (RPI). All configuration is hardcoded in `routes/samlRoutes.js` for maximum debugging and testing capabilities.

## Configuration

The SAML configuration is hardcoded in `routes/samlRoutes.js` with the following settings:

### RPI Identity Provider Settings
- **Entry Point**: `https://shib.auth.rpi.edu/idp/profile/SAML2/Redirect/SSO`
- **Entity ID**: `https://shib-idp.rpi.edu/idp/shibboleth`
- **Certificate**: RPI's signing certificate (embedded in code)

### Service Provider Settings
- **Entity ID**: `https://study-compass.com/saml/metadata`
- **Callback URL**: `https://study-compass.com/saml/callback`
- **Logout URL**: `https://study-compass.com/saml/logout`

## Endpoints

### Authentication
- `GET /saml/login` - Initiates SAML login
- `GET/POST /saml/callback` - Handles SAML response
- `POST /saml/logout` - Logs out user

### Metadata & Debug
- `GET /saml/metadata` - Serves static SP metadata
- `GET /saml/debug` - Shows current configuration
- `GET /saml/test-callback` - Test endpoint for callback URL

## User Attribute Mapping

The implementation maps standard eduPerson attributes from RPI:

- **Email**: `urn:oid:1.3.6.1.4.1.5923.1.1.1.6` (eduPersonPrincipalName)
- **Given Name**: `urn:oid:2.5.4.42` (givenName)
- **Surname**: `urn:oid:2.5.4.4` (sn)
- **Display Name**: `urn:oid:2.16.840.1.113730.3.1.241` (displayName)
- **UID**: `urn:oid:0.9.2342.19200300.100.1.1` (uid)
- **Affiliation**: `urn:oid:1.3.6.1.4.1.5923.1.1.1.9` (eduPersonAffiliation)

## Role Assignment

- Users with `faculty` in their affiliation get both `user` and `admin` roles
- All other users get the `user` role

## Debugging

The implementation includes extensive logging with clear section markers:

- `=== SAML LOGIN INITIATED ===`
- `=== SAML CALLBACK RECEIVED ===`
- `=== SAML PROFILE DEBUG ===`
- `=== SAML AUTHENTICATION CALLBACK ===`

All SAML profiles are logged in full JSON format for debugging.

## Testing

To test the implementation:

1. Start the server
2. Visit `/saml/debug` to verify configuration
3. Visit `/saml/metadata` to see the SP metadata
4. Initiate login via `/saml/login?relayState=/room/none`

## Environment Variables Required

- `JWT_SECRET` - For signing access tokens
- `JWT_REFRESH_SECRET` - For signing refresh tokens (optional, falls back to JWT_SECRET)
- `NODE_ENV` - Set to 'production' for secure cookies

## Notes

- This is a simplified implementation for testing purposes
- All configuration is hardcoded for maximum debugging
- No database configuration is required
- Session management is handled by Express session middleware
- Cookies are set with appropriate security settings based on environment 
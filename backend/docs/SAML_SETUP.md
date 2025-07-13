# SAML Authentication Setup Guide

This guide explains how to set up SAML authentication for Study Compass using samlify.

## Overview

Study Compass supports SAML 2.0 authentication for multi-tenant university deployments. Each university can have its own SAML configuration, allowing students and staff to authenticate using their institutional credentials.

## Architecture

- **Multi-tenant**: Each subdomain (e.g., `berkeley.study-compass.com`) has its own SAML configuration
- **Flexible attribute mapping**: Configurable mapping between SAML attributes and user fields
- **Automatic user provisioning**: Users can be automatically created from SAML attributes
- **Coexistence with OAuth**: SAML works alongside existing Google OAuth authentication

## Prerequisites

1. **Node.js 16+** and npm
2. **OpenSSL** for certificate generation
3. **University SAML metadata** from your IdP (Identity Provider)
4. **Database access** for the target university

## Installation

1. Install dependencies:
```bash
npm install
```

2. Generate self-signed certificates (for testing):
```bash
node scripts/setupSAML.js <school> --interactive
```

## Quick Setup

### 1. Interactive Setup (Recommended)

```bash
node scripts/setupSAML.js berkeley --interactive
```

This will guide you through:
- Base URL configuration
- IdP Entity ID
- SSO/SLO URLs
- X509 Certificate
- User provisioning settings

### 2. Manual Setup

1. Create SAML configuration via API:
```bash
curl -X POST https://berkeley.study-compass.com/auth/saml/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "entityId": "https://berkeley.study-compass.com/auth/saml/metadata",
    "idp": {
      "entityId": "https://auth.berkeley.edu/saml/metadata",
      "ssoUrl": "https://auth.berkeley.edu/saml/sso",
      "sloUrl": "https://auth.berkeley.edu/saml/slo",
      "x509Cert": "-----BEGIN CERTIFICATE-----\n..."
    },
    "sp": {
      "assertionConsumerService": "https://berkeley.study-compass.com/auth/saml/callback",
      "singleLogoutService": "https://berkeley.study-compass.com/auth/saml/logout",
      "x509Cert": "-----BEGIN CERTIFICATE-----\n...",
      "privateKey": "-----BEGIN PRIVATE KEY-----\n..."
    }
  }'
```

2. Test the configuration:
```bash
curl -X POST https://berkeley.study-compass.com/auth/saml/test \
  -H "Authorization: Bearer <admin-token>"
```

3. Activate the configuration:
```bash
# Update isActive to true in the database
```

## Configuration Options

### SAML Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `wantAssertionsSigned` | `true` | Require signed assertions |
| `wantMessageSigned` | `false` | Require signed messages |
| `wantNameId` | `true` | Include NameID in requests |
| `signatureAlgorithm` | `sha256` | Signature algorithm |
| `digestAlgorithm` | `sha256` | Digest algorithm |

### Attribute Mapping

Configure how SAML attributes map to user fields:

```json
{
  "attributeMapping": {
    "email": "email",
    "username": "username", 
    "firstName": "firstName",
    "lastName": "lastName",
    "displayName": "displayName",
    "studentId": "studentId",
    "department": "department",
    "role": "role"
  }
}
```

### User Provisioning

| Setting | Default | Description |
|---------|---------|-------------|
| `autoCreateUsers` | `true` | Automatically create new users |
| `autoUpdateUsers` | `true` | Update existing users with SAML attributes |
| `defaultRoles` | `["user"]` | Default roles for new users |
| `usernameGeneration` | `email_prefix` | How to generate usernames |

## API Endpoints

### Authentication

- `GET /auth/saml/login` - Initiate SAML login
- `POST /auth/saml/callback` - Process SAML response
- `POST /auth/saml/logout` - SAML logout

### Configuration Management

- `GET /auth/saml/metadata` - Get SAML metadata
- `GET /auth/saml/config` - Get current configuration
- `POST /auth/saml/config` - Create/update configuration
- `POST /auth/saml/test` - Test configuration
- `GET /auth/saml/test-login` - Get test login URL

## Testing

### 1. Test Configuration

```bash
curl -X POST https://berkeley.study-compass.com/auth/saml/test \
  -H "Authorization: Bearer <admin-token>"
```

### 2. Test Login Flow

```bash
# Get test login URL
curl -X GET https://berkeley.study-compass.com/auth/saml/test-login \
  -H "Authorization: Bearer <admin-token>"

# Follow the returned URL to test the login flow
```

### 3. Validate Metadata

```bash
curl -X GET https://berkeley.study-compass.com/auth/saml/metadata
```

## Troubleshooting

### Common Issues

1. **Certificate Errors**
   - Ensure certificates are in PEM format
   - Check certificate validity dates
   - Verify certificate chain

2. **URL Mismatches**
   - Confirm all URLs are accessible
   - Check for trailing slashes
   - Verify HTTPS vs HTTP

3. **Attribute Mapping**
   - Verify SAML attribute names match IdP
   - Check for case sensitivity
   - Ensure required attributes are present

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=samlify:*
```

### Logs

Check application logs for SAML-related errors:
```bash
tail -f logs/app.log | grep -i saml
```

## Security Considerations

1. **Certificate Management**
   - Use proper certificates in production
   - Implement certificate rotation
   - Store private keys securely

2. **URL Security**
   - Use HTTPS for all SAML endpoints
   - Validate relay states
   - Implement proper session management

3. **Attribute Security**
   - Validate all SAML attributes
   - Sanitize user input
   - Implement proper authorization

## Production Deployment

### 1. Certificate Setup

```bash
# Generate production certificates
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 3650 -nodes
```

### 2. Environment Variables

```bash
# Add to .env
SAML_DEBUG=false
SAML_STRICT_MODE=true
```

### 3. Monitoring

- Monitor SAML authentication success/failure rates
- Set up alerts for configuration changes
- Log all SAML interactions

## Integration with Existing Auth

SAML authentication works alongside existing Google OAuth:

- Users can authenticate via SAML or Google OAuth
- SAML users get the same JWT tokens as OAuth users
- All existing authorization mechanisms work with SAML users

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Contact the development team

## References

- [SAML 2.0 Specification](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [samlify Documentation](https://github.com/authenio/samlify)
- [Study Compass API Documentation](https://docs.study-compass.com) 


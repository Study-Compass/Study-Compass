# QR Code Management System

## Overview

The QR Code Management System allows administrators to create, manage, and track QR codes with custom redirects and detailed analytics. The system provides a comprehensive interface for managing QR codes through the admin panel.

## Features

### Core Functionality
- **Create QR Codes**: Set up new QR codes with custom names, descriptions, and redirect URLs
- **Custom Redirects**: Each QR code can redirect to any URL when scanned
- **Active/Inactive Status**: Enable or disable QR codes as needed
- **Detailed Analytics**: Track total scans, unique scans, repeat scans, and scan history
- **Visual Analytics**: View scan activity over time with charts
- **Search and Filter**: Find QR codes by name, description, or status
- **Bulk Management**: View all QR codes in a paginated list

### Analytics Features
- **Real-time Tracking**: Track every scan with timestamp, user agent, IP address, and referrer
- **Unique vs Repeat Scans**: Distinguish between first-time and returning visitors
- **Time-based Analytics**: View scan activity by hour, day, week, or month
- **Overview Dashboard**: See system-wide statistics
- **Individual QR Analytics**: Detailed analytics for each QR code

## How It Works

### QR Code Creation
1. Navigate to Admin Panel → QR Codes
2. Click "Create QR Code"
3. Fill in the required fields:
   - **Name**: Unique identifier for the QR code
   - **Description**: Optional description for organization
   - **Redirect URL**: Where users will be redirected when scanning (supports both relative and absolute URLs)
   - **Location**: Optional location tag
   - **Campaign**: Optional campaign tag
   - **Active Status**: Whether the QR code is currently active

### QR Code Usage
1. After creating a QR code, you'll get a URL like: `https://yourdomain.com/qr/your-qr-name`
2. Use any QR code generator to create a QR code with this URL
3. When users scan the QR code, they'll be:
   - Automatically redirected to your specified URL (relative URLs are converted to absolute)
   - Tracked for analytics (if they haven't visited before)
   - Marked as a repeat visitor on subsequent scans

### URL Examples
- **Relative URLs**: `/room/none`, `/events`, `/profile`, `/admin`
- **Absolute URLs**: `https://example.com`, `https://google.com`
- **Mixed Usage**: You can use relative URLs for internal pages and absolute URLs for external sites

### Analytics Access
1. In the QR Codes admin panel, click "Analytics" on any QR code
2. View detailed statistics including:
   - Total scans, unique scans, and repeat scans
   - Scan activity over time
   - Creation and last scan dates
   - Visual charts showing scan patterns

## API Endpoints

### QR Code Management
- `GET /qr` - List all QR codes with filtering and pagination
- `POST /qr` - Create a new QR code
- `GET /qr/:id` - Get specific QR code details
- `PUT /qr/:id` - Update a QR code
- `DELETE /qr/:id` - Delete a QR code

### Analytics
- `GET /qr/:id/analytics` - Get analytics for a specific QR code
- `GET /qr/analytics/overview` - Get system-wide analytics overview
- `GET /qr/:id/history` - Get detailed scan history

### QR Code Scanning
- `POST /qr` (with name parameter) - Process a QR code scan

## Database Schema

The QR code system uses an enhanced schema with the following fields:

```javascript
{
  name: String (unique, required),
  description: String,
  redirectUrl: String (required),
  isActive: Boolean (default: true),
  scans: Number (default: 0),
  repeated: Number (default: 0),
  uniqueScans: Number (default: 0),
  createdAt: Date,
  lastScanned: Date,
  scanHistory: [{
    timestamp: Date,
    isRepeat: Boolean,
    userAgent: String,
    ipAddress: String,
    referrer: String
  }],
  tags: [String],
  location: String,
  campaign: String
}
```

## Best Practices

### QR Code Naming
- Use descriptive, unique names
- Avoid special characters that might cause URL issues
- Consider using a naming convention (e.g., `location-purpose-date`)

### Redirect URLs
- **Relative URLs**: Use paths like `/room/none`, `/events`, `/profile` for internal redirects
- **Absolute URLs**: Use full URLs (including `https://`) for external redirects
- The system automatically converts relative URLs to absolute URLs
- Test redirect URLs before creating QR codes
- Consider using URL shorteners for long redirect URLs

### Analytics Usage
- Monitor scan patterns to optimize placement
- Use tags and campaigns to organize QR codes
- Regularly review inactive QR codes

### Security Considerations
- QR codes are publicly accessible - don't include sensitive information in names
- Use HTTPS for all redirect URLs
- Monitor for unusual scan patterns

## Troubleshooting

### Common Issues

**QR code not working**
- Check if the QR code is active
- Verify the redirect URL is valid
- Ensure the QR code name exists in the system

**Analytics not updating**
- Clear browser cache and local storage
- Check if the user has visited before (affects unique vs repeat tracking)

**Redirect not working**
- Verify the redirect URL is accessible
- Check for any CORS issues with the target URL

### Support

For technical issues or questions about the QR code system, please refer to the backend logs or contact the development team.

## Future Enhancements

Potential future features:
- QR code templates
- Bulk QR code creation
- Advanced analytics with geographic data
- QR code expiration dates
- Custom landing pages
- Integration with external analytics platforms

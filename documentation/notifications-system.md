# Notification System Documentation

## Overview

The Study Compass notification system provides maximum flexibility for creating, managing, and delivering notifications to both users and organizations. The system supports various notification types, statuses, actions, and delivery channels.

## Key Features

### 🔄 **Flexible Recipients**
- Send notifications to individual users
- Send notifications to organizations
- Support for both User and Org models

### 📊 **Status Management**
- **unread**: New notifications
- **read**: User has seen the notification
- **acknowledged**: User has taken action
- **archived**: Notification is archived but preserved
- **deleted**: Soft-deleted notification

### 🎯 **Action System**
- **button**: Simple button actions
- **link**: Navigate to URLs
- **form**: Display forms
- **api_call**: Execute API calls with payloads

### 📡 **Delivery Channels**
- **in_app**: In-application notifications
- **email**: Email notifications
- **push**: Push notifications
- **sms**: SMS notifications
- **webhook**: Webhook delivery

### 🏷️ **Notification Types**
- **system**: System-generated notifications
- **user**: User-to-user notifications
- **org**: Organization notifications
- **event**: Event-related notifications
- **membership**: Membership changes
- **approval**: Approval requests
- **reminder**: Reminders
- **achievement**: Achievements/badges
- **security**: Security alerts
- **custom**: Custom notifications

## Database Schema

### Core Fields

```javascript
{
  // Recipient
  recipient: ObjectId,        // User or Org ID
  recipientModel: String,     // 'User' or 'Org'
  
  // Sender (optional)
  sender: ObjectId,           // User or Org ID
  senderModel: String,        // 'User' or 'Org'
  
  // Content
  title: String,              // Notification title
  message: String,            // Notification message
  type: String,               // Notification type
  category: String,           // Optional category
  priority: String,           // low, normal, high, urgent
  
  // Status
  status: String,             // unread, read, acknowledged, archived, deleted
  readAt: Date,               // When marked as read
  acknowledgedAt: Date,       // When acknowledged
  archivedAt: Date,           // When archived
  
  // Actions
  actions: [{
    id: String,               // Unique action ID
    label: String,            // Display label
    type: String,             // button, link, form, api_call
    url: String,              // For link/api_call types
    method: String,           // GET, POST, PUT, DELETE
    payload: Mixed,           // Data for api_call
    style: String,            // primary, secondary, success, danger, warning, info
    order: Number             // Display order
  }],
  
  // Metadata
  metadata: Mixed,            // Flexible data storage
  relatedEntities: [ObjectId], // Related entities
  relatedEntityModels: [String], // Entity types
  
  // Timing
  expiresAt: Date,            // Expiration date
  scheduledFor: Date,         // Scheduled delivery
  
  // Delivery
  deliveryStatus: String,     // pending, sent, delivered, failed
  deliveryAttempts: Number,   // Number of delivery attempts
  lastDeliveryAttempt: Date,  // Last attempt timestamp
  channels: [String],         // Delivery channels
  
  // Template
  template: {
    name: String,             // Template name
    version: String,          // Template version
    variables: Mixed          // Template variables
  },
  
  // Threading
  threadId: ObjectId,         // Thread parent
  isThreadRoot: Boolean,      // Is thread root
  
  // Batch
  batchId: String,            // Batch identifier
  
  // Soft delete
  deletedAt: Date             // Soft delete timestamp
}
```

## API Endpoints

### Get Notifications
```http
GET /api/notifications?status=unread&type=system&limit=20&skip=0
```

### Get Unread Count
```http
GET /api/notifications/unread-count
```

### Get Statistics
```http
GET /api/notifications/statistics
```

### Create Notification (Admin)
```http
POST /api/notifications
{
  "recipient": "user_id",
  "recipientModel": "User",
  "title": "Welcome!",
  "message": "Welcome to Study Compass!",
  "type": "system",
  "priority": "normal",
  "channels": ["in_app", "email"],
  "actions": [
    {
      "id": "complete_profile",
      "label": "Complete Profile",
      "type": "link",
      "url": "/profile/complete",
      "style": "primary"
    }
  ]
}
```

### Create System Notification
```http
POST /api/notifications/system
{
  "recipient": "user_id",
  "recipientModel": "User",
  "templateName": "welcome",
  "variables": {
    "name": "John Doe"
  }
}
```

### Send to Organization
```http
POST /api/notifications/org/org_id
{
  "title": "Meeting Reminder",
  "message": "Don't forget about tomorrow's meeting!",
  "type": "reminder",
  "roles": ["admin", "officer"],
  "priority": "high"
}
```

### Mark as Read
```http
PATCH /api/notifications/notification_id/read
```

### Mark Multiple as Read
```http
PATCH /api/notifications/read-multiple
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

### Mark All as Read
```http
PATCH /api/notifications/read-all
{
  "type": "system"
}
```

### Execute Action
```http
POST /api/notifications/notification_id/actions/action_id
{
  "additionalData": {
    "customField": "value"
  }
}
```

## Usage Examples

### 1. Welcome Notification
```javascript
const notificationService = require('../services/notificationService');

// Create welcome notification
await notificationService.createSystemNotification(
  userId,
  'User',
  'welcome',
  { name: user.name }
);
```

### 2. Organization Invitation
```javascript
// Create invitation notification
const notification = await notificationService.createNotification({
  recipient: userId,
  recipientModel: 'User',
  title: 'Organization Invitation',
  message: `You have been invited to join ${orgName} as ${role}`,
  type: 'membership',
  priority: 'high',
  channels: ['in_app', 'email'],
  actions: [
    {
      id: 'accept_invitation',
      label: 'Accept',
      type: 'api_call',
      url: '/api/org/invitations/accept',
      method: 'POST',
      payload: { invitationId: invitationId },
      style: 'success'
    },
    {
      id: 'decline_invitation',
      label: 'Decline',
      type: 'api_call',
      url: '/api/org/invitations/decline',
      method: 'POST',
      payload: { invitationId: invitationId },
      style: 'secondary'
    }
  ],
  metadata: {
    orgId: orgId,
    invitationId: invitationId,
    role: role
  }
});
```

### 3. Event Reminder
```javascript
// Send event reminder to org members
await notificationService.sendToOrgMembers(
  orgId,
  {
    title: 'Event Reminder',
    message: 'Your event starts in 1 hour!',
    type: 'reminder',
    priority: 'high',
    channels: ['in_app', 'push'],
    actions: [
      {
        id: 'view_event',
        label: 'View Event',
        type: 'link',
        url: `/events/${eventId}`,
        style: 'primary'
      }
    ],
    metadata: {
      eventId: eventId,
      eventName: eventName
    }
  },
  { roles: ['member', 'officer', 'admin'] }
);
```

### 4. Achievement Notification
```javascript
// Create achievement notification
await notificationService.createNotification({
  recipient: userId,
  recipientModel: 'User',
  title: 'Achievement Unlocked!',
  message: `Congratulations! You've earned the "${badgeName}" badge.`,
  type: 'achievement',
  priority: 'normal',
  channels: ['in_app', 'email'],
  actions: [
    {
      id: 'view_badge',
      label: 'View Badge',
      type: 'link',
      url: `/badges/${badgeId}`,
      style: 'success'
    },
    {
      id: 'share_achievement',
      label: 'Share',
      type: 'api_call',
      url: '/api/achievements/share',
      method: 'POST',
      payload: { badgeId: badgeId },
      style: 'info'
    }
  ],
  metadata: {
    badgeId: badgeId,
    badgeName: badgeName,
    achievementType: 'badge'
  }
});
```

### 5. Security Alert
```javascript
// Create security alert
await notificationService.createNotification({
  recipient: userId,
  recipientModel: 'User',
  title: 'Security Alert',
  message: 'New login detected from an unrecognized device.',
  type: 'security',
  priority: 'urgent',
  channels: ['in_app', 'email', 'sms'],
  actions: [
    {
      id: 'review_login',
      label: 'Review Login',
      type: 'link',
      url: '/security/login-activity',
      style: 'warning'
    },
    {
      id: 'secure_account',
      label: 'Secure Account',
      type: 'link',
      url: '/security/settings',
      style: 'danger'
    }
  ],
  metadata: {
    loginLocation: 'New York, NY',
    deviceType: 'Mobile',
    timestamp: new Date()
  }
});
```

## Template System

### Built-in Templates

#### Welcome Template
```javascript
{
  name: 'welcome',
  title: 'Welcome to Study Compass!',
  message: 'Hi {{name}}, welcome to Study Compass! We\'re excited to have you on board.',
  version: '1.0',
  priority: 'normal',
  channels: ['in_app', 'email'],
  actions: [
    {
      id: 'complete_profile',
      label: 'Complete Profile',
      type: 'link',
      url: '/profile/complete',
      style: 'primary'
    }
  ]
}
```

#### Organization Invitation Template
```javascript
{
  name: 'org_invitation',
  title: 'Organization Invitation',
  message: 'You have been invited to join {{orgName}} as {{role}}.',
  version: '1.0',
  priority: 'high',
  channels: ['in_app', 'email'],
  actions: [
    {
      id: 'accept_invitation',
      label: 'Accept',
      type: 'api_call',
      url: '/api/org/invitations/accept',
      method: 'POST',
      payload: { invitationId: '{{invitationId}}' },
      style: 'success'
    },
    {
      id: 'decline_invitation',
      label: 'Decline',
      type: 'api_call',
      url: '/api/org/invitations/decline',
      method: 'POST',
      payload: { invitationId: '{{invitationId}}' },
      style: 'secondary'
    }
  ]
}
```

## Best Practices

### 1. **Use Appropriate Priorities**
- **urgent**: Security alerts, critical system issues
- **high**: Important updates, time-sensitive information
- **normal**: Regular notifications, updates
- **low**: Informational content, non-critical updates

### 2. **Choose Right Channels**
- **in_app**: Always include for immediate visibility
- **email**: For important notifications that need persistence
- **push**: For time-sensitive notifications
- **sms**: For critical alerts only
- **webhook**: For system integrations

### 3. **Action Design**
- Keep actions simple and clear
- Use appropriate button styles
- Provide fallback actions
- Test action execution thoroughly

### 4. **Metadata Usage**
- Store relevant context data
- Use for filtering and analytics
- Keep metadata lightweight
- Document metadata structure

### 5. **Performance Considerations**
- Use batch operations for multiple notifications
- Implement proper indexing
- Clean up expired notifications regularly
- Monitor delivery status

### 6. **Security**
- Validate all inputs
- Check permissions before sending
- Sanitize notification content
- Log notification activities

## Integration Examples

### Frontend Integration
```javascript
// React component example
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    setNotifications(data.data);
  };

  const markAsRead = async (notificationId) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    fetchUnreadCount();
  };

  const executeAction = async (notificationId, actionId) => {
    const response = await fetch(`/api/notifications/${notificationId}/actions/${actionId}`, {
      method: 'POST'
    });
    const result = await response.json();
    
    if (result.data.type === 'redirect') {
      window.location.href = result.data.url;
    }
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications ({unreadCount})</h3>
        <button onClick={() => markAllAsRead()}>Mark All Read</button>
      </div>
      
      {notifications.map(notification => (
        <div key={notification._id} className={`notification ${notification.status}`}>
          <div className="notification-content">
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <span className="timestamp">{new Date(notification.createdAt).toLocaleString()}</span>
          </div>
          
          <div className="notification-actions">
            {notification.status === 'unread' && (
              <button onClick={() => markAsRead(notification._id)}>
                Mark Read
              </button>
            )}
            
            {notification.actions.map(action => (
              <button
                key={action.id}
                className={`btn btn-${action.style}`}
                onClick={() => executeAction(notification._id, action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### WebSocket Integration
```javascript
// Real-time notification updates
const socket = io();

socket.on('notification', (notification) => {
  // Add new notification to list
  addNotification(notification);
  
  // Update unread count
  updateUnreadCount();
  
  // Show toast notification
  showToast(notification);
});

socket.on('notification_update', (update) => {
  // Update existing notification
  updateNotification(update);
});
```

## Maintenance

### Cleanup Job
```javascript
// Run daily to archive expired notifications
const cleanupExpiredNotifications = async () => {
  try {
    const result = await notificationService.cleanupExpired();
    console.log(`Archived ${result.modifiedCount} expired notifications`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
};

// Schedule with cron or similar
setInterval(cleanupExpiredNotifications, 24 * 60 * 60 * 1000);
```

### Analytics
```javascript
// Get notification statistics
const stats = await notificationService.getStatistics(userId, 'User');
console.log('Notification stats:', stats);
// Output: { total: 150, unread: 5, read: 120, acknowledged: 20, archived: 5 }
```

## Troubleshooting

### Common Issues

1. **Notifications not appearing**
   - Check delivery status
   - Verify recipient permissions
   - Check channel configuration

2. **Actions not working**
   - Validate action configuration
   - Check API endpoint availability
   - Verify payload format

3. **Performance issues**
   - Review database indexes
   - Implement pagination
   - Use batch operations

4. **Delivery failures**
   - Check channel service status
   - Verify credentials
   - Review error logs

### Debug Mode
```javascript
// Enable debug logging
process.env.NOTIFICATION_DEBUG = 'true';

// Check notification delivery
const notification = await Notification.findById(notificationId);
console.log('Delivery status:', notification.deliveryStatus);
console.log('Delivery attempts:', notification.deliveryAttempts);
console.log('Last attempt:', notification.lastDeliveryAttempt);
```

This notification system provides the flexibility and power needed for a comprehensive study platform while maintaining simplicity and performance. 
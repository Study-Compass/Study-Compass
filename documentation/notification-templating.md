# Notification Template System

## Overview

The Study Compass notification system supports multiple templating approaches, from simple variable interpolation to advanced conditional logic. This document explains each approach and provides guidance on when to use them.

## Template Approaches

### 1. Basic Template with Formatting (Recommended for Simple Cases)

**Syntax**: `{{variable|format}}`

**Best for**: Simple notifications with basic variable substitution and formatting.

**Features**:
- Variable interpolation with validation
- Built-in formatting options
- Missing variable handling
- HTML-safe output

**Example**:
```javascript
// Template
{
    title: 'Welcome to Study Compass!',
    message: 'Hi {{name|capitalize}}, welcome to Study Compass! You joined on {{joinDate|date}}.',
    actions: [
        {
            id: 'complete_profile',
            label: 'Complete Profile',
            type: 'link',
            url: '/profile/complete'
        }
    ]
}

// Variables
{
    name: 'john doe',
    joinDate: new Date('2024-01-15')
}

// Result
// Title: "Welcome to Study Compass!"
// Message: "Hi John doe, welcome to Study Compass! You joined on 1/15/2024."
```

**Available Formatting Options**:
- `date` - Format as date (1/20/2024)
- `time` - Format as time (2:30:00 PM)
- `datetime` - Format as date and time (1/20/2024, 2:30:00 PM)
- `capitalize` - Capitalize first letter (John)
- `uppercase` - Convert to uppercase (JOHN)
- `lowercase` - Convert to lowercase (john)
- `number` - Format number with commas (1,234)
- `currency` - Format as currency ($123.45)
- `short` - Truncate long text (truncated...)

### 2. Advanced Template with Conditional Logic (Recommended for Complex Cases)

**Syntax**: Conditional objects with `if`, `then`, `else` logic

**Best for**: Dynamic notifications that change based on user state, context, or conditions.

**Features**:
- Conditional message content
- Dynamic priority levels
- Conditional delivery channels
- Conditional actions
- Complex business logic

**Example**:
```javascript
// Template
{
    title: 'Welcome to Study Compass!',
    message: {
        type: 'conditional',
        conditions: [
            {
                if: '{{hasProfile}}',
                then: 'Welcome back, {{name|capitalize}}! Your profile is complete.',
                else: 'Hi {{name|capitalize}}, welcome to Study Compass! Please complete your profile.'
            }
        ],
        default: 'Welcome to Study Compass!'
    },
    priority: {
        type: 'conditional',
        conditions: [
            { if: '!{{hasProfile}}', then: 'high' }
        ],
        default: 'normal'
    },
    actions: {
        type: 'conditional',
        conditions: [
            {
                if: '!{{hasProfile}}',
                then: [
                    {
                        id: 'complete_profile',
                        label: 'Complete Profile',
                        type: 'link',
                        url: '/profile/complete'
                    }
                ]
            }
        ],
        default: [
            {
                id: 'explore',
                label: 'Explore',
                type: 'link',
                url: '/dashboard'
            }
        ]
    }
}

// Variables
{
    name: 'john doe',
    hasProfile: false
}

// Result
// Message: "Hi John doe, welcome to Study Compass! Please complete your profile."
// Priority: "high"
// Actions: Only "Complete Profile" button shows
```

### 3. Hybrid Approach (Recommended for Most Cases)

**Best for**: Notifications that need some conditional logic but mostly use simple formatting.

**Example**:
```javascript
// Template
{
    title: 'Event Reminder',
    message: '{{eventName}} starts in {{timeUntil}} at {{startTime|time}}.',
    priority: {
        type: 'conditional',
        conditions: [
            { if: '{{isUrgent}}', then: 'urgent' },
            { if: '{{isToday}}', then: 'high' }
        ],
        default: 'normal'
    },
    actions: [
        {
            id: 'view_event',
            label: 'View Event',
            type: 'link',
            url: '/events/{{eventId}}'
        },
        {
            id: 'join_now',
            label: 'Join Now',
            type: 'link',
            url: '/events/{{eventId}}/join',
            condition: '{{canJoin}}'
        }
    ]
}
```

## When to Use Each Approach

### Use Basic Templates When:
- ✅ Simple variable substitution needed
- ✅ Consistent message structure
- ✅ No conditional logic required
- ✅ Quick implementation needed
- ✅ Template is unlikely to change

**Examples**:
- Welcome messages
- Simple confirmations
- Basic reminders
- Achievement notifications

### Use Advanced Templates When:
- ✅ Complex business logic required
- ✅ Dynamic content based on user state
- ✅ Conditional actions needed
- ✅ Multiple delivery channels based on context
- ✅ Priority changes based on conditions

**Examples**:
- Onboarding flows
- Event reminders with different urgency levels
- Security alerts with conditional actions
- Payment notifications with different states

### Use Hybrid Approach When:
- ✅ Some conditional logic needed
- ✅ Mostly simple formatting
- ✅ Balance between complexity and maintainability
- ✅ Gradual enhancement of existing templates

**Examples**:
- Most notification types
- Event notifications
- Membership notifications
- Achievement notifications

## Best Practices

### 1. Variable Naming
```javascript
// Good
{ userName: 'john', eventDate: new Date() }

// Bad
{ u: 'john', d: new Date() }
```

### 2. Formatting Usage
```javascript
// Good - Use appropriate formatting
'Hello {{name|capitalize}}, you have {{count|number}} notifications.'

// Bad - No formatting
'Hello {{name}}, you have {{count}} notifications.'
```

### 3. Missing Variable Handling
```javascript
// Good - System shows [variableName] for missing variables
'Hello {{name|capitalize}}, you have {{count|number}} notifications.'
// If count is missing: "Hello John, you have [count] notifications."

// Bad - Shows raw template syntax
'Hello {{name}}, you have {{count}} notifications.'
// If count is missing: "Hello John, you have {{count}} notifications."
```

### 4. Conditional Logic
```javascript
// Good - Clear, readable conditions
{
    if: '{{isUrgent}}',
    then: '🚨 URGENT: {{eventName}} starts soon!'
}

// Bad - Complex, hard-to-read conditions
{
    if: '{{eventTime}} < {{now}} && {{priority}} == "high"',
    then: 'URGENT: {{eventName}}'
}
```

### 5. Action Conditions
```javascript
// Good - Simple boolean conditions
{
    id: 'join_event',
    label: 'Join Now',
    condition: '{{canJoin}}'
}

// Bad - Complex conditions in actions
{
    id: 'join_event',
    label: 'Join Now',
    condition: '{{eventStatus}} == "active" && {{userRole}} == "member"'
}
```

## Template Examples by Use Case

### User Onboarding
```javascript
{
    name: 'dynamic_welcome',
    title: 'Welcome to Study Compass!',
    message: {
        type: 'conditional',
        conditions: [
            {
                if: '{{hasProfile}}',
                then: 'Welcome back, {{name|capitalize}}! Your profile is complete.',
                else: 'Hi {{name|capitalize}}, welcome to Study Compass! Please complete your profile.'
            }
        ]
    },
    actions: {
        type: 'conditional',
        conditions: [
            {
                if: '!{{hasProfile}}',
                then: [{ id: 'complete_profile', label: 'Complete Profile', type: 'link', url: '/profile/complete' }]
            }
        ],
        default: [{ id: 'explore', label: 'Explore', type: 'link', url: '/dashboard' }]
    }
}
```

### Event Reminders
```javascript
{
    name: 'smart_event_reminder',
    title: 'Event Reminder',
    message: {
        type: 'conditional',
        conditions: [
            {
                if: '{{isUrgent}}',
                then: '🚨 URGENT: {{eventName}} starts in {{timeUntil}}!'
            },
            {
                if: '{{isToday}}',
                then: 'Today: {{eventName}} at {{startTime|time}}'
            }
        ],
        default: '{{eventName}} on {{startDate|date}} at {{startTime|time}}'
    },
    priority: {
        type: 'conditional',
        conditions: [
            { if: '{{isUrgent}}', then: 'urgent' },
            { if: '{{isToday}}', then: 'high' }
        ],
        default: 'normal'
    }
}
```

### Payment Notifications
```javascript
{
    name: 'payment_received',
    title: 'Payment Received',
    message: 'You received <strong>{{amount|currency}}</strong> from <em>{{senderName|capitalize}}</em> on {{paymentDate|date}}.',
    actions: [
        {
            id: 'view_transaction',
            label: 'View Details',
            type: 'link',
            url: '/transactions/{{transactionId}}'
        }
    ]
}
```

### Achievement Notifications
```javascript
{
    name: 'achievement_unlocked',
    title: 'Achievement Unlocked! 🏆',
    message: 'Congratulations! You\'ve earned the <strong>{{badgeName}}</strong> badge for {{achievementDescription|short}}.',
    actions: [
        {
            id: 'view_badge',
            label: 'View Badge',
            type: 'link',
            url: '/badges/{{badgeId}}'
        },
        {
            id: 'share_achievement',
            label: 'Share',
            type: 'api_call',
            url: '/api/achievements/share',
            method: 'POST',
            payload: { badgeId: '{{badgeId}}' }
        }
    ]
}
```

## Migration Guide

### From Simple {{variable}} to Formatted {{variable|format}}

**Before**:
```javascript
message: 'Hello {{name}}, you have {{count}} notifications on {{date}}.'
```

**After**:
```javascript
message: 'Hello {{name|capitalize}}, you have {{count|number}} notifications on {{date|date}}.'
```

### From Static to Conditional Templates

**Before**:
```javascript
message: 'Welcome to Study Compass!'
```

**After**:
```javascript
message: {
    type: 'conditional',
    conditions: [
        {
            if: '{{hasProfile}}',
            then: 'Welcome back, {{name|capitalize}}!',
            else: 'Hi {{name|capitalize}}, please complete your profile.'
        }
    ]
}
```

## Testing Templates

### Unit Testing
```javascript
const notificationService = new NotificationService();

// Test basic formatting
const result = notificationService.interpolateTemplate(
    'Hello {{name|capitalize}}!',
    { name: 'john doe' }
);
console.log(result); // "Hello John doe!"

// Test missing variables
const result2 = notificationService.interpolateTemplate(
    'Hello {{name|capitalize}}, you have {{count|number}} notifications.',
    { name: 'john' } // count is missing
);
console.log(result2); // "Hello John, you have [count] notifications."
```

### Integration Testing
```javascript
// Test full template processing
const notification = await notificationService.createSystemNotification(
    'user123',
    'User',
    'welcome',
    { name: 'john doe', hasProfile: false }
);

console.log(notification.message); // Should show appropriate message based on hasProfile
```

## Performance Considerations

### Template Caching
- Templates are loaded once and cached
- Variable interpolation is fast
- Conditional logic has minimal overhead

### Database Impact
- Template variables are stored in the notification document
- Processed templates include the original variables for debugging
- No additional database queries for template processing

### Memory Usage
- Templates are lightweight JavaScript objects
- Variable interpolation creates new strings (normal behavior)
- No significant memory overhead

## Security Considerations

### HTML Injection Prevention
- Templates support HTML in messages (using `dangerouslySetInnerHTML` in frontend)
- Variables are not automatically HTML-escaped
- Use appropriate HTML tags in templates: `<strong>`, `<em>`, etc.

### Variable Validation
- Missing variables show `[variableName]` instead of raw template syntax
- No arbitrary code execution in templates
- Conditional logic is limited to simple boolean operations

### Template Access Control
- Templates are defined in the service code
- No user-provided templates
- Template names are validated before loading 
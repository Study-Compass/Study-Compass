const getModels = require('./getModelService');
const mongoose = require('mongoose');
const axios = require('axios');

class NotificationService {
    constructor(models = null) {
        this.models = models;
    }

    /**
     * Create service instance with models
     */
    static withModels(models) {
        return new NotificationService(models);
    }

    /**
     * Get models - throws error if not provided
     */
    getModels() {
        if (!this.models) {
            throw new Error('Models not provided to NotificationService');
        }
        return this.models;
    }
    /**
     * Create a single notification
     */
    async createNotification(notificationData) {
        try {
            const { Notification } = this.getModels();
            const notification = new Notification(notificationData);
            await notification.save();
            
            // Trigger delivery if not scheduled
            if (!notification.scheduledFor || notification.scheduledFor <= new Date()) {
                await this.deliverNotification(notification);
            }
            
            return notification;
        } catch (error) {
            throw new Error(`Failed to create notification: ${error.message}`);
        }
    }

    /**
     * Create multiple notifications in batch
     */
    async createBatchNotifications(notificationsData) {
        try {
            const { Notification } = this.getModels();
            const notifications = await Notification.createBatch(notificationsData);
            
            // Deliver notifications that aren't scheduled
            const immediateNotifications = notifications.filter(
                n => !n.scheduledFor || n.scheduledFor <= new Date()
            );
            
            for (const notification of immediateNotifications) {
                await this.deliverNotification(notification);
            }
            
            return notifications;
        } catch (error) {
            throw new Error(`Failed to create batch notifications: ${error.message}`);
        }
    }

    /**
     * Send notification to multiple recipients
     */
    async sendToMultipleRecipients(recipients, notificationData) {
        try {
            const notifications = recipients.map(recipient => ({
                ...notificationData,
                recipient: recipient.id,
                recipientModel: recipient.model
            }));
            
            return await this.createBatchNotifications(notifications);
        } catch (error) {
            throw new Error(`Failed to send to multiple recipients: ${error.message}`);
        }
    }

    /**
     * Send notification to all users in an organization
     */
    async sendToOrgMembers(orgId, notificationData, options = {}) {
        try {
            const { Org } = this.getModels();
            const org = await Org.findById(orgId).populate('members');
            if (!org) {
                throw new Error('Organization not found');
            }

            let members = org.members || [];
            
            // Filter by role if specified
            if (options.roles) {
                members = members.filter(member => 
                    options.roles.includes(member.role)
                );
            }

            const notifications = members.map(member => ({
                ...notificationData,
                recipient: member.userId,
                recipientModel: 'User',
                metadata: {
                    ...notificationData.metadata,
                    orgId: orgId,
                    memberRole: member.role
                }
            }));

            return await this.createBatchNotifications(notifications);
        } catch (error) {
            throw new Error(`Failed to send to org members: ${error.message}`);
        }
    }

    /**
     * Deliver notification through specified channels
     */
    async deliverNotification(notification) {
        try {
            notification.deliveryAttempts += 1;
            notification.lastDeliveryAttempt = new Date();
            
            const deliveryPromises = notification.channels.map(channel => 
                this.deliverToChannel(notification, channel)
            );
            
            await Promise.allSettled(deliveryPromises);
            
            // Update delivery status based on results
            notification.deliveryStatus = 'sent';
            await notification.save();
            
        } catch (error) {
            notification.deliveryStatus = 'failed';
            await notification.save();
            throw new Error(`Failed to deliver notification: ${error.message}`);
        }
    }

    /**
     * Deliver notification to a specific channel
     */
    async deliverToChannel(notification, channel) {
        switch (channel) {
            case 'in_app':
                // In-app notifications are already "delivered" when created
                return Promise.resolve();
                
            case 'email':
                return this.sendEmailNotification(notification);
                
            case 'push':
                return this.sendPushNotification(notification);
                
            case 'sms':
                return this.sendSMSNotification(notification);
                
            case 'webhook':
                return this.sendWebhookNotification(notification);
                
            default:
                throw new Error(`Unsupported channel: ${channel}`);
        }
    }

    /**
     * Send email notification
     */
    async sendEmailNotification(notification) {
        // TODO: Implement email service integration
        console.log(`Sending email notification: ${notification.title}`);
        return Promise.resolve();
    }

    /**
     * Send push notification
     */
    async sendPushNotification(notification) {
        // TODO: Implement push notification service
        console.log(`Sending push notification: ${notification.title}`);
        return Promise.resolve();
    }

    /**
     * Send SMS notification
     */
    async sendSMSNotification(notification) {
        // TODO: Implement SMS service
        console.log(`Sending SMS notification: ${notification.title}`);
        return Promise.resolve();
    }

    /**
     * Send webhook notification
     */
    async sendWebhookNotification(notification) {
        // TODO: Implement webhook delivery
        console.log(`Sending webhook notification: ${notification.title}`);
        return Promise.resolve();
    }

    /**
     * Get notifications for a recipient
     */
    async getNotifications(recipientId, recipientModel, options = {}) {
        try {
            const { Notification } = this.getModels();
            const queryOptions = {
                limit: options.limit || 20,
                skip: options.skip || 0
            };
            
            if (options.status) {
                queryOptions.status = options.status;
            }
            
            if (options.type) {
                queryOptions.type = options.type;
            }
            
            return await Notification.findByRecipient(recipientId, recipientModel, queryOptions).populate('sender');
        } catch (error) {
            throw new Error(`Failed to get notifications: ${error.message}`);
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(recipientId, recipientModel) {
        try {
            const { Notification } = this.getModels();
            return await Notification.countDocuments({
                recipient: recipientId,
                recipientModel: recipientModel,
                status: 'unread'
            });
        } catch (error) {
            throw new Error(`Failed to get unread count: ${error.message}`);
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, recipientId) {
        try {
            const { Notification } = this.getModels();
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: recipientId
            });
            
            if (!notification) {
                throw new Error('Notification not found');
            }
            
            return await notification.markAsRead();
        } catch (error) {
            throw new Error(`Failed to mark as read: ${error.message}`);
        }
    }

    /**
     * Mark multiple notifications as read
     */
    async markMultipleAsRead(notificationIds, recipientId) {
        try {
            const { Notification } = this.getModels();
            return await Notification.updateMany(
                {
                    _id: { $in: notificationIds },
                    recipient: recipientId
                },
                {
                    status: 'read',
                    readAt: new Date()
                }
            );
        } catch (error) {
            throw new Error(`Failed to mark multiple as read: ${error.message}`);
        }
    }

    /**
     * Mark all notifications as read for a recipient
     */
    async markAllAsRead(recipientId, recipientModel, options = {}) {
        try {
            const { Notification } = this.getModels();
            const query = {
                recipient: recipientId,
                recipientModel: recipientModel,
                status: 'unread'
            };
            
            if (options.type) {
                query.type = options.type;
            }
            
            return await Notification.updateMany(
                query,
                {
                    status: 'read',
                    readAt: new Date()
                }
            );
        } catch (error) {
            throw new Error(`Failed to mark all as read: ${error.message}`);
        }
    }

    /**
     * Acknowledge notification
     */
    async acknowledgeNotification(notificationId, recipientId) {
        try {
            const { Notification } = this.getModels();
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: recipientId
            });
            
            if (!notification) {
                throw new Error('Notification not found');
            }
            
            return await notification.acknowledge();
        } catch (error) {
            throw new Error(`Failed to acknowledge notification: ${error.message}`);
        }
    }

    /**
     * Archive notification
     */
    async archiveNotification(notificationId, recipientId) {
        try {
            const { Notification } = this.getModels();
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: recipientId
            });
            
            if (!notification) {
                throw new Error('Notification not found');
            }
            
            return await notification.archive();
        } catch (error) {
            throw new Error(`Failed to archive notification: ${error.message}`);
        }
    }

    /**
     * Delete notification (soft delete)
     */
    async deleteNotification(notificationId, recipientId) {
        try {
            const { Notification } = this.getModels();
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: recipientId
            });
            
            if (!notification) {
                throw new Error('Notification not found');
            }
            
            return await notification.softDelete();
        } catch (error) {
            throw new Error(`Failed to delete notification: ${error.message}`);
        }
    }

    /**
     * Execute notification action
     */
    async executeAction(notificationId, actionId, recipientId, additionalData = {}, req = null) {
        try {
            const { Notification } = this.getModels();
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: recipientId
            });
            
            if (!notification) {
                throw new Error('Notification not found');
            }
            
            const action = notification.actions.find(a => a.id === actionId);
            if (!action) {
                throw new Error('Action not found');
            }
            
            // Execute action based on type
            switch (action.type) {
                case 'api_call':
                    const result =  await this.executeApiCall(action, additionalData, req); // pass req
                    notification.actionResult = result;
                    await notification.save();
                    return result;
                case 'link':
                    return { type: 'redirect', url: action.url };
                case 'form':
                    return { type: 'form', action: action };
                default:
                    return { type: 'button', action: action };
            }
        } catch (error) {
            console.error('Error executing action:', error);
            throw new Error(`Failed to execute action: ${error.message}`);
        }
    }

    /**
     * Execute API call action
     */
    async executeApiCall(action, additionalData, req = null) {
        // If req is provided, forward cookies for internal calls
        const headers = {};
        let url = action.url;
        if (req && req.headers && req.headers.cookie && url && url.startsWith('/')) {
            headers.Cookie = req.headers.cookie;
            const baseUrl = process.env.NODE_ENV === 'production' ? `https://${req.school}.study-compass.com` : 'http://localhost:5001';
            url = baseUrl + url;
        }
        // Optionally, add more headers (user-agent, etc.)
        const response = await require('axios')({
            method: action.method,
            url,
            data: additionalData,
            headers,
        });
        return { type: 'api_call', success: true, data: response.data };
    }

    /**
     * Interpolate all string fields in an object/array
     */
    interpolateObject(obj, variables) {
        if (typeof obj === 'string') {
            return this.interpolateTemplate(obj, variables);
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.interpolateObject(item, variables));
        } else if (typeof obj === 'object' && obj !== null) {
            const result = {};
            for (const key in obj) {
                result[key] = this.interpolateObject(obj[key], variables);
            }
            return result;
        }
        return obj;
    }

    /**
     * Create system notification
     */
    async createSystemNotification(recipientId, recipientModel, templateName, variables = {}) {
        try {
            // TODO: Load template from database or file system
            const template = await this.loadTemplate(templateName);
            
            const notificationData = {
                recipient: recipientId,
                recipientModel: recipientModel,
                type: 'system',
                title: this.interpolateTemplate(template.title, variables),
                message: this.interpolateTemplate(template.message, variables),
                template: {
                    name: templateName,
                    version: template.version,
                    variables: variables
                },
                actions: template.actions ? this.interpolateObject(template.actions, variables) : [],
                priority: template.priority || 'normal',
                channels: template.channels || ['in_app']
            };
            
            return await this.createNotification(notificationData);
        } catch (error) {
            throw new Error(`Failed to create system notification: ${error.message}`);
        }
    }

    /**
     * Load notification template
     */
    async loadTemplate(templateName) {
        // TODO: Implement template loading from database
        const templates = {
            'welcome': {
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
            },
            'org_invitation': {
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
            },
            'friend_request': {
                title: 'New Friend Request',
                message: '{{senderName}} has sent you a friend request.',
                version: '1.0',
                priority: 'normal',
                channels: ['in_app'],
                actions: [
                    {
                        id: 'accept_friend_request',
                        label: 'Accept',
                        type: 'api_call',
                        url: '/friend-request/accept/{{friendshipId}}',
                        method: 'POST',
                        style: 'success'
                    },
                    {
                        id: 'reject_friend_request',
                        label: 'Reject',
                        type: 'api_call',
                        url: '/friend-request/reject/{{friendshipId}}',
                        method: 'POST',
                        style: 'danger'
                    }
                ]
            },
            'org_member_applied': {
                title: 'New Member Applied',
                message: '{{senderName}} has applied to join {{orgName}}.',
                version: '1.0',
                priority: 'normal',
                channels: ['in_app'],
                actions: [
                    {
                        id: 'go_to_application',
                        label: 'Go to Application',
                        type: 'link',
                        url: '/club-dashboard/{{orgName}}?page=2',
                        style: 'primary'
                    }   
                ]
            }
        };
        
        return templates[templateName] || templates['welcome'];
    }

    /**
     * Interpolate template variables
     */
    interpolateTemplate(template, variables) {
        //log all matchs
        console.log('template', template);
        console.log('variables', variables);
        console.log('matches', template.match(/\{\{(\w+)\}\}/g));
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    /**
     * Cleanup expired notifications
     */
    async cleanupExpired() {
        try {
            const { Notification } = this.getModels();
            return await Notification.cleanupExpired();
        } catch (error) {
            throw new Error(`Failed to cleanup expired notifications: ${error.message}`);
        }
    }

    /**
     * Get notification statistics
     */
    async getStatistics(recipientId, recipientModel) {
        try {
            const { Notification } = this.getModels();
            const stats = await Notification.aggregate([
                {
                    $match: {
                        recipient: new mongoose.Types.ObjectId(recipientId),
                        recipientModel: recipientModel
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const result = {
                total: 0,
                unread: 0,
                read: 0,
                acknowledged: 0,
                archived: 0
            };
            
            stats.forEach(stat => {
                result[stat._id] = stat.count;
                result.total += stat.count;
            });
            
            return result;
        } catch (error) {
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }
    //batch template notification
    async createBatchTemplateNotification(recipients, templateName, variables = {}) {
        const template = await this.loadTemplate(templateName);
        const notifications = recipients.map(recipient => ({
            recipient: recipient.id,
            recipientModel: recipient.model,
            type: 'system',
            title: this.interpolateTemplate(template.title, variables),
            message: this.interpolateTemplate(template.message, variables),
            template: {
                name: templateName,
                version: template.version,
                variables: variables
            },
            actions: template.actions ? this.interpolateObject(template.actions, variables) : [],
            priority: template.priority || 'normal',
            channels: template.channels || ['in_app']
        }));
        return await this.createBatchNotifications(notifications);
    }
    
    
}

module.exports = NotificationService; 
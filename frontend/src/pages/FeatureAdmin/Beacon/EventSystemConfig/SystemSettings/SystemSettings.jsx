import React, { useState } from 'react';
import './SystemSettings.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

const SystemSettings = ({ config, onChange }) => {
    const [expandedSections, setExpandedSections] = useState({
        defaultEventSettings: true,
        notificationSettings: false,
        systemRestrictions: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleChange = (section, field, value) => {
        onChange({
            ...config,
            [section]: {
                ...config[section],
                [field]: value
            }
        });
    };

    const handleArrayChange = (section, field, value) => {
        const currentArray = config[section][field] || [];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        
        handleChange(section, field, newArray);
    };

    const handleBlackoutDateAdd = () => {
        const newDate = {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
            reason: ''
        };
        
        const currentDates = config.systemRestrictions.blackoutDates || [];
        handleChange('systemRestrictions', 'blackoutDates', [...currentDates, newDate]);
    };

    const handleBlackoutDateRemove = (index) => {
        const currentDates = config.systemRestrictions.blackoutDates || [];
        const newDates = currentDates.filter((_, i) => i !== index);
        handleChange('systemRestrictions', 'blackoutDates', newDates);
    };

    const handleBlackoutDateChange = (index, field, value) => {
        const currentDates = config.systemRestrictions.blackoutDates || [];
        const newDates = currentDates.map((date, i) => 
            i === index ? { ...date, [field]: value } : date
        );
        handleChange('systemRestrictions', 'blackoutDates', newDates);
    };

    return (
        <div className="system-settings">
            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('defaultEventSettings')}
                >
                    <div className="section-title">
                        <Icon icon="mdi:calendar-cog" />
                        <h3>Default Event Settings</h3>
                    </div>
                    <Icon 
                        icon={expandedSections.defaultEventSettings ? "mdi:chevron-up" : "mdi:chevron-down"}
                        className="expand-icon"
                    />
                </div>
                
                {expandedSections.defaultEventSettings && (
                    <div className="section-content">
                        <div className="setting-group">
                            <div className="setting-item">
                                <label>RSVP Enabled by Default</label>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.defaultEventSettings.rsvpEnabled}
                                        onChange={(e) => handleChange('defaultEventSettings', 'rsvpEnabled', e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </div>
                            </div>
                            
                            <div className="setting-item">
                                <label>RSVP Required by Default</label>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.defaultEventSettings.rsvpRequired}
                                        onChange={(e) => handleChange('defaultEventSettings', 'rsvpRequired', e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </div>
                            </div>
                            
                            <div className="setting-item">
                                <label>Approval Required by Default</label>
                                <div className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={config.defaultEventSettings.approvalRequired}
                                        onChange={(e) => handleChange('defaultEventSettings', 'approvalRequired', e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </div>
                            </div>
                            
                            <div className="setting-item">
                                <label>Default Visibility</label>
                                <select
                                    value={config.defaultEventSettings.visibility}
                                    onChange={(e) => handleChange('defaultEventSettings', 'visibility', e.target.value)}
                                >
                                    <option value="public">Public</option>
                                    <option value="campus">Campus Only</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            
                            <div className="setting-item">
                                <label>Default Max Attendees</label>
                                <input
                                    type="number"
                                    value={config.defaultEventSettings.maxAttendees || ''}
                                    onChange={(e) => handleChange('defaultEventSettings', 'maxAttendees', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="No limit"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('notificationSettings')}
                >
                    <div className="section-title">
                        <Icon icon="mdi:bell-cog" />
                        <h3>Notification Settings</h3>
                    </div>
                    <Icon 
                        icon={expandedSections.notificationSettings ? "mdi:chevron-up" : "mdi:chevron-down"}
                        className="expand-icon"
                    />
                </div>
                
                {expandedSections.notificationSettings && (
                    <div className="section-content">
                        <div className="setting-group">
                            <div className="setting-item">
                                <label>Default Notification Channels</label>
                                <div className="checkbox-group">
                                    {['email', 'push', 'sms', 'in_app'].map(channel => (
                                        <label key={channel} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={config.notificationSettings.defaultChannels?.includes(channel) || false}
                                                onChange={() => handleArrayChange('notificationSettings', 'defaultChannels', channel)}
                                            />
                                            <span className="checkmark"></span>
                                            {channel.charAt(0).toUpperCase() + channel.slice(1).replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="setting-item">
                                <label>Reminder Intervals (hours before event)</label>
                                <div className="array-input">
                                    {config.notificationSettings.reminderIntervals?.map((interval, index) => (
                                        <div key={index} className="array-item">
                                            <input
                                                type="number"
                                                value={interval}
                                                onChange={(e) => {
                                                    const newIntervals = [...config.notificationSettings.reminderIntervals];
                                                    newIntervals[index] = parseInt(e.target.value);
                                                    handleChange('notificationSettings', 'reminderIntervals', newIntervals);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newIntervals = config.notificationSettings.reminderIntervals.filter((_, i) => i !== index);
                                                    handleChange('notificationSettings', 'reminderIntervals', newIntervals);
                                                }}
                                            >
                                                <Icon icon="mdi:delete" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newIntervals = [...(config.notificationSettings.reminderIntervals || []), 24];
                                            handleChange('notificationSettings', 'reminderIntervals', newIntervals);
                                        }}
                                    >
                                        <Icon icon="mdi:plus" />
                                        Add Interval
                                    </button>
                                </div>
                            </div>
                            
                            <div className="setting-item">
                                <label>Escalation Timeout (hours)</label>
                                <input
                                    type="number"
                                    value={config.notificationSettings.escalationTimeouts}
                                    onChange={(e) => handleChange('notificationSettings', 'escalationTimeouts', parseInt(e.target.value))}
                                />
                            </div>
                            
                            <div className="setting-item">
                                <label>Batch Notification Limit</label>
                                <input
                                    type="number"
                                    value={config.notificationSettings.batchNotificationLimit}
                                    onChange={(e) => handleChange('notificationSettings', 'batchNotificationLimit', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('systemRestrictions')}
                >
                    <div className="section-title">
                        <Icon icon="mdi:shield-cog" />
                        <h3>System Restrictions</h3>
                    </div>
                    <Icon 
                        icon={expandedSections.systemRestrictions ? "mdi:chevron-up" : "mdi:chevron-down"}
                        className="expand-icon"
                    />
                </div>
                
                {expandedSections.systemRestrictions && (
                    <div className="section-content">
                        <div className="setting-group">
                            <div className="setting-item">
                                <label>Max Events Per User</label>
                                <input
                                    type="number"
                                    value={config.systemRestrictions.maxEventsPerUser}
                                    onChange={(e) => handleChange('systemRestrictions', 'maxEventsPerUser', parseInt(e.target.value))}
                                />
                            </div>
                            
                            <div className="setting-item">
                                <label>Max Events Per Organization</label>
                                <input
                                    type="number"
                                    value={config.systemRestrictions.maxEventsPerOrg}
                                    onChange={(e) => handleChange('systemRestrictions', 'maxEventsPerOrg', parseInt(e.target.value))}
                                />
                            </div>
                            
                            <div className="setting-item">
                                <label>Advance Booking Limit (days)</label>
                                <input
                                    type="number"
                                    value={config.systemRestrictions.advanceBookingLimit}
                                    onChange={(e) => handleChange('systemRestrictions', 'advanceBookingLimit', parseInt(e.target.value))}
                                />
                            </div>
                            
                            <div className="setting-item">
                                <label>Minimum Booking Advance (hours)</label>
                                <input
                                    type="number"
                                    value={config.systemRestrictions.minBookingAdvance}
                                    onChange={(e) => handleChange('systemRestrictions', 'minBookingAdvance', parseInt(e.target.value))}
                                />
                            </div>
                            
                            <div className="setting-item">
                                <label>Blackout Dates</label>
                                <div className="blackout-dates">
                                    {config.systemRestrictions.blackoutDates?.map((date, index) => (
                                        <div key={index} className="blackout-date-item">
                                            <input
                                                type="date"
                                                value={date.start}
                                                onChange={(e) => handleBlackoutDateChange(index, 'start', e.target.value)}
                                            />
                                            <span>to</span>
                                            <input
                                                type="date"
                                                value={date.end}
                                                onChange={(e) => handleBlackoutDateChange(index, 'end', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Reason"
                                                value={date.reason}
                                                onChange={(e) => handleBlackoutDateChange(index, 'reason', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleBlackoutDateRemove(index)}
                                            >
                                                <Icon icon="mdi:delete" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={handleBlackoutDateAdd}
                                        className="add-blackout-btn"
                                    >
                                        <Icon icon="mdi:plus" />
                                        Add Blackout Date
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemSettings;

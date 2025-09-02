import React, { useState, useRef } from 'react';
import { useFetch } from '../../../../hooks/useFetch';
import apiRequest from '../../../../utils/postRequest';
import { Icon } from '@iconify-icon/react';
import UnsavedChangesBanner from '../../../../components/UnsavedChangesBanner/UnsavedChangesBanner';
import useUnsavedChanges from '../../../../hooks/useUnsavedChanges';
import './Configuration.scss';

function Configuration({ section = 'general' }) {
    const { data: config, loading, error, refetch } = useFetch('/org-management/config');
    const [localConfig, setLocalConfig] = useState(null);
    const originalDataRef = useRef(null);

    React.useEffect(() => {
        if (config?.data) {
            setLocalConfig(config.data);
            // Always update original data ref when config changes (including after refetch)
            originalDataRef.current = JSON.parse(JSON.stringify(config.data));
        }
    }, [config]);

    // Original data for comparison
    const originalData = config?.data ? JSON.parse(JSON.stringify(config.data)) : null;

    const handleSave = async () => {
        if (!localConfig) return false;
        
        try {
            const response = await apiRequest('/org-management/config', localConfig, { method: 'PUT' });
            if (response.success) {
                refetch();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving configuration:', error);
            return false;
        }
    };

    const handleDiscard = () => {
        // Reset to original values
        if (originalDataRef.current) {
            setLocalConfig(JSON.parse(JSON.stringify(originalDataRef.current)));
        }
    };

    // Only set up the hook when we have both original data and local config
    const { hasChanges, saving, handleSave: saveChanges, handleDiscard: discardChanges } = useUnsavedChanges(
        originalDataRef.current,
        localConfig,
        handleSave,
        handleDiscard
    );

    // Debug logging
    console.log('Configuration Debug:', {
        hasOriginalData: !!originalDataRef.current,
        hasLocalConfig: !!localConfig,
        hasChanges,
        originalDataKeys: originalDataRef.current ? Object.keys(originalDataRef.current) : null,
        localConfigKeys: localConfig ? Object.keys(localConfig) : null
    });

    // Render different sections based on the section prop
    const renderSection = () => {
        switch (section) {
            case 'verification-types':
                return renderVerificationTypes();
            case 'review-workflow':
                return renderReviewWorkflow();
            case 'policies':
                return renderPolicies();
            case 'general':
            default:
                return renderGeneral();
        }
    };

    const updateConfig = (path, value) => {
        if (!localConfig) return;
        
        const keys = path.split('.');
        const newConfig = { ...localConfig };
        let current = newConfig;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        setLocalConfig(newConfig);
    };

    const updateVerificationType = (typeKey, field, value) => {
        if (!localConfig) return;
        
        const newConfig = { ...localConfig };
        if (!newConfig.verificationStatusTypes) {
            newConfig.verificationStatusTypes = {};
        }
        if (!newConfig.verificationStatusTypes[typeKey]) {
            newConfig.verificationStatusTypes[typeKey] = {};
        }
        
        newConfig.verificationStatusTypes[typeKey][field] = value;
        setLocalConfig(newConfig);
    };

    const updateVerificationTypeRequirement = (typeKey, requirement, value) => {
        if (!localConfig) return;
        
        const newConfig = { ...localConfig };
        if (!newConfig.verificationStatusTypes) {
            newConfig.verificationStatusTypes = {};
        }
        if (!newConfig.verificationStatusTypes[typeKey]) {
            newConfig.verificationStatusTypes[typeKey] = {};
        }
        if (!newConfig.verificationStatusTypes[typeKey].requirements) {
            newConfig.verificationStatusTypes[typeKey].requirements = {};
        }
        
        newConfig.verificationStatusTypes[typeKey].requirements[requirement] = value;
        setLocalConfig(newConfig);
    };

    const addVerificationType = () => {
        if (!localConfig) return;
        
        const newConfig = { ...localConfig };
        if (!newConfig.verificationStatusTypes) {
            newConfig.verificationStatusTypes = {};
        }
        
        // Generate a unique key for the new verification type
        const baseKey = 'new_verification_type';
        let key = baseKey;
        let counter = 1;
        while (newConfig.verificationStatusTypes[key]) {
            key = `${baseKey}_${counter}`;
            counter++;
        }
        
        // Add default verification type
        newConfig.verificationStatusTypes[key] = {
            name: 'New Verification Type',
            description: 'Description for the new verification type',
            color: '#4caf50',
            icon: 'mdi:shield-check',
            requirements: {
                minMembers: 5,
                minAge: 30
            },
            benefits: ['event_creation', 'member_management']
        };
        
        setLocalConfig(newConfig);
    };

    const removeVerificationType = (typeKey) => {
        if (!localConfig) return;
        
        // Don't allow removing 'basic' as it's the default fallback
        if (typeKey === 'basic') {
            alert('Cannot remove the basic verification type as it is required for system functionality.');
            return;
        }
        
        // Show confirmation dialog
        const verificationTypeName = localConfig.verificationStatusTypes[typeKey]?.name || typeKey;
        const confirmed = window.confirm(
            `Are you sure you want to remove the verification type "${verificationTypeName}"?\n\n` +
            'This action cannot be undone and may affect existing organizations using this verification type.'
        );
        
        if (!confirmed) return;
        
        const newConfig = { ...localConfig };
        if (newConfig.verificationStatusTypes && newConfig.verificationStatusTypes[typeKey]) {
            delete newConfig.verificationStatusTypes[typeKey];
            
            // If this was the default verification type, reset to basic
            if (newConfig.defaultVerificationType === typeKey) {
                newConfig.defaultVerificationType = 'basic';
            }
            
            setLocalConfig(newConfig);
        }
    };

    const renameVerificationType = (oldKey, newKey) => {
        if (!localConfig) return;
        
        // Don't allow renaming 'basic' as it's the default fallback
        if (oldKey === 'basic') {
            alert('Cannot rename the basic verification type as it is required for system functionality.');
            return;
        }
        
        // Validate new key format
        if (!/^[a-z_][a-z0-9_]*$/.test(newKey)) {
            alert('Verification type key must contain only lowercase letters, numbers, and underscores, and must start with a letter or underscore.');
            return;
        }
        
        // Check if new key already exists
        if (localConfig.verificationStatusTypes[newKey] && newKey !== oldKey) {
            alert('A verification type with this key already exists.');
            return;
        }
        
        const newConfig = { ...localConfig };
        if (newConfig.verificationStatusTypes && newConfig.verificationStatusTypes[oldKey]) {
            // Copy the verification type to the new key
            newConfig.verificationStatusTypes[newKey] = { ...newConfig.verificationStatusTypes[oldKey] };
            
            // Remove the old key
            delete newConfig.verificationStatusTypes[oldKey];
            
            // Update default verification type if it was the renamed one
            if (newConfig.defaultVerificationType === oldKey) {
                newConfig.defaultVerificationType = newKey;
            }
            
            setLocalConfig(newConfig);
        }
    };

    if (loading) {
        return (
            <div className="configuration">
                <div className="loading">Loading configuration...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="configuration">
                <div className="error">Error loading configuration: {error}</div>
            </div>
        );
    }

    if (!localConfig) {
        return (
            <div className="configuration">
                <div className="loading">Initializing configuration...</div>
            </div>
        );
    }

    // Render functions for different sections
    const renderGeneral = () => (
        <div className="config-sections">
            {/* Verification Settings */}
            <div className="config-section">
                <h2>
                    <Icon icon="mdi:shield-check" />
                    Verification Settings
                </h2>
                
                <div className="config-group">
                    <div className="config-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localConfig.verificationEnabled}
                                onChange={(e) => updateConfig('verificationEnabled', e.target.checked)}
                            />
                            Enable Verification System
                        </label>
                        <p>Allow organizations to submit verification requests</p>
                    </div>

                    <div className="config-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localConfig.verificationRequired}
                                onChange={(e) => updateConfig('verificationRequired', e.target.checked)}
                            />
                            Require Verification
                        </label>
                        <p>Make verification mandatory for all organizations</p>
                    </div>

                    <div className="config-item">
                        <label>Auto-approve new organizations</label>
                        <input
                            type="checkbox"
                            checked={localConfig.autoApproveNewOrgs}
                            onChange={(e) => updateConfig('autoApproveNewOrgs', e.target.checked)}
                        />
                        <p>Automatically approve new organizations</p>
                    </div>

                    <div className="config-item">
                        <label>Auto-approval threshold (members)</label>
                        <input
                            type="number"
                            value={localConfig.autoApproveThreshold}
                            onChange={(e) => updateConfig('autoApproveThreshold', parseInt(e.target.value))}
                            min="0"
                        />
                        <p>Minimum members required for auto-approval</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderVerificationTypes = () => (
        <div className="config-sections">
            {/* Verification Types Management */}
            <div className="config-section">
                <h2>
                    <Icon icon="mdi:shield-star" />
                    Verification Types Management
                </h2>
                
                <div className="config-group">
                    <div className="config-item">
                        <label>Enable Custom Verification Types</label>
                        <input
                            type="checkbox"
                            checked={localConfig.enableCustomVerificationTypes}
                            onChange={(e) => updateConfig('enableCustomVerificationTypes', e.target.checked)}
                        />
                        <p>Allow organizations to request different verification levels</p>
                    </div>

                    <div className="config-item">
                        <label>Default Verification Type</label>
                        <select
                            value={localConfig.defaultVerificationType}
                            onChange={(e) => updateConfig('defaultVerificationType', e.target.value)}
                        >
                            {Object.entries(localConfig.verificationStatusTypes || {}).map(([key, config]) => (
                                <option key={key} value={key}>
                                    {config.name}
                                </option>
                            ))}
                        </select>
                        <p>Default verification type for new organizations</p>
                    </div>

                    <div className="config-item">
                        <label>Auto-upgrade Threshold (days)</label>
                        <input
                            type="number"
                            value={localConfig.autoUpgradeThreshold}
                            onChange={(e) => updateConfig('autoUpgradeThreshold', parseInt(e.target.value))}
                            min="0"
                        />
                        <p>Days after which organizations can request status upgrades</p>
                    </div>
                </div>

                {/* Verification Types Editor */}
                <div className="config-group">
                    <div className="verification-types-header">
                        <div>
                            <h3>Verification Types</h3>
                            <p>Configure individual verification types and their requirements</p>
                        </div>
                        <button 
                            className="add-verification-type-btn"
                            onClick={addVerificationType}
                        >
                            <Icon icon="mdi:plus" />
                            Add Verification Type
                        </button>
                    </div>
                    
                    {Object.entries(localConfig.verificationStatusTypes || {}).map(([key, config]) => (
                        <div key={key} className="verification-type-editor">
                            <div className="type-header">
                                <div className="type-info">
                                    <h4>{config.name}</h4>
                                    <span className="type-key">({key})</span>
                                </div>
                                <button 
                                    className="remove-verification-type-btn"
                                    onClick={() => removeVerificationType(key)}
                                    title={key === 'basic' ? 'Cannot remove basic verification type' : 'Remove verification type'}
                                    disabled={key === 'basic'}
                                >
                                    <Icon icon="mdi:delete" />
                                </button>
                            </div>
                            
                            <div className="type-fields">
                                <div className="form-group">
                                    <label>Key (Internal ID):</label>
                                    <input
                                        type="text"
                                        value={key}
                                        onChange={(e) => renameVerificationType(key, e.target.value)}
                                        disabled={key === 'basic'}
                                        placeholder="verification_type_key"
                                    />
                                    <small>Only lowercase letters, numbers, and underscores. Cannot be changed for 'basic' type.</small>
                                </div>
                                
                                <div className="form-group">
                                    <label>Display Name:</label>
                                    <input
                                        type="text"
                                        value={config.name}
                                        onChange={(e) => updateVerificationType(key, 'name', e.target.value)}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Description:</label>
                                    <textarea
                                        value={config.description}
                                        onChange={(e) => updateVerificationType(key, 'description', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Color:</label>
                                    <input
                                        type="color"
                                        value={config.color}
                                        onChange={(e) => updateVerificationType(key, 'color', e.target.value)}
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Icon:</label>
                                    <input
                                        type="text"
                                        value={config.icon}
                                        onChange={(e) => updateVerificationType(key, 'icon', e.target.value)}
                                        placeholder="mdi:icon-name"
                                    />
                                </div>
                                
                                <div className="requirements-section">
                                    <h5>Requirements</h5>
                                    <div className="form-group">
                                        <label>Minimum Members:</label>
                                        <input
                                            type="number"
                                            value={config.requirements?.minMembers || 0}
                                            onChange={(e) => updateVerificationTypeRequirement(key, 'minMembers', parseInt(e.target.value))}
                                            min="0"
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>Minimum Age (days):</label>
                                        <input
                                            type="number"
                                            value={config.requirements?.minAge || 0}
                                            onChange={(e) => updateVerificationTypeRequirement(key, 'minAge', parseInt(e.target.value))}
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderReviewWorkflow = () => (
        <div className="config-sections">
            {/* Review Workflow */}
            <div className="config-section">
                <h2>
                    <Icon icon="mdi:clipboard-check" />
                    Review Workflow Settings
                </h2>
                
                <div className="config-group">
                    <div className="config-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localConfig.reviewWorkflow?.requireMultipleApprovers}
                                onChange={(e) => updateConfig('reviewWorkflow.requireMultipleApprovers', e.target.checked)}
                            />
                            Require Multiple Approvers
                        </label>
                    </div>

                    <div className="config-item">
                        <label>Minimum Approvers</label>
                        <input
                            type="number"
                            value={localConfig.reviewWorkflow?.minApprovers}
                            onChange={(e) => updateConfig('reviewWorkflow.minApprovers', parseInt(e.target.value))}
                            min="1"
                        />
                    </div>

                    <div className="config-item">
                        <label>Auto-escalate after (days)</label>
                        <input
                            type="number"
                            value={localConfig.reviewWorkflow?.autoEscalateAfterDays}
                            onChange={(e) => updateConfig('reviewWorkflow.autoEscalateAfterDays', parseInt(e.target.value))}
                            min="1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPolicies = () => (
        <div className="config-sections">
            {/* Policies */}
            <div className="config-section">
                <h2>
                    <Icon icon="mdi:policy" />
                    Organization Policies
                </h2>
                
                <div className="config-group">
                    <div className="config-item">
                        <label>Max Members per Organization</label>
                        <input
                            type="number"
                            value={localConfig.policies?.maxMembersPerOrg}
                            onChange={(e) => updateConfig('policies.maxMembersPerOrg', parseInt(e.target.value))}
                            min="1"
                        />
                    </div>

                    <div className="config-item">
                        <label>Max Events per Month</label>
                        <input
                            type="number"
                            value={localConfig.policies?.maxEventsPerMonth}
                            onChange={(e) => updateConfig('policies.maxEventsPerMonth', parseInt(e.target.value))}
                            min="0"
                        />
                    </div>

                    <div className="config-item">
                        <label>
                            <input
                                type="checkbox"
                                checked={localConfig.policies?.requireFacultyAdvisor}
                                onChange={(e) => updateConfig('policies.requireFacultyAdvisor', e.target.checked)}
                            />
                            Require Faculty Advisor
                        </label>
                    </div>

                    <div className="config-item">
                        <label>Minimum Meeting Frequency</label>
                        <select
                            value={localConfig.policies?.minMeetingFrequency}
                            onChange={(e) => updateConfig('policies.minMeetingFrequency', e.target.value)}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Bi-weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="configuration">
            <UnsavedChangesBanner
                hasChanges={hasChanges}
                onSave={saveChanges}
                onDiscard={discardChanges}
                saving={saving}
            />
            
            <header className="header">
                <h1>{section === 'general' ? 'General Configuration' : 
                     section === 'verification-types' ? 'Verification Types' :
                     section === 'review-workflow' ? 'Review Workflow' :
                     section === 'policies' ? 'Organization Policies' : 'Configuration'}</h1>
                <p>Manage organization management system settings</p>
            </header>

            <div className="content">
                {renderSection()}
            </div>
        </div>
    );
}

export default Configuration;

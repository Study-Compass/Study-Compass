import React, { useState, useEffect } from 'react';
import './EventSystemConfig.scss';
import { useFetch } from '../../../../hooks/useFetch';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import SystemSettings from './SystemSettings/SystemSettings';
import DomainManager from './DomainManager/DomainManager';
import TemplateManager from './TemplateManager/TemplateManager';
import IntegrationManager from './IntegrationManager/IntegrationManager';
import AnalyticsConfig from './AnalyticsConfig/AnalyticsConfig';
import { useNotification } from '../../../../NotificationContext';

const EventSystemConfig = () => {
    const [activeTab, setActiveTab] = useState('system');
    const [config, setConfig] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalConfig, setOriginalConfig] = useState(null);
    const { addNotification } = useNotification();
    
    const configData = useFetch('/api/event-system-config');
    
    useEffect(() => {
        if (configData.data?.success) {
            const config = configData.data.data;
            setConfig(config);
            setOriginalConfig(JSON.parse(JSON.stringify(config)));
        }
    }, [configData.data]);
    
    const handleConfigChange = (section, updates) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...prev[section], ...updates }
        }));
        setHasChanges(true);
    };
    
    const handleSave = async () => {
        if (!config) return;
        
        try {
            const response = await fetch('/api/event-system-config', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include',
                body: JSON.stringify(config)
            });
            
            const result = await response.json();
            
            if (result.success) {
                setHasChanges(false);
                setOriginalConfig(JSON.parse(JSON.stringify(config)));
                addNotification({
                    title: 'Success',
                    message: 'Configuration saved successfully',
                    type: 'success'
                });
            } else {
                throw new Error(result.message || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Failed to save configuration:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to save configuration: ' + error.message,
                type: 'error'
            });
        }
    };
    
    const handleReset = () => {
        if (originalConfig) {
            setConfig(JSON.parse(JSON.stringify(originalConfig)));
            setHasChanges(false);
            addNotification({
                title: 'Reset',
                message: 'Configuration reset to last saved state',
                type: 'info'
            });
        }
    };
    
    if (configData.loading) {
        return (
            <div className="event-system-config loading">
                <div className="loading-spinner">
                    <Icon icon="mdi:loading" className="spinning" />
                    <p>Loading configuration...</p>
                </div>
            </div>
        );
    }
    
    if (configData.error) {
        return (
            <div className="event-system-config error">
                <div className="error-message">
                    <Icon icon="mdi:alert-circle" />
                    <h3>Error Loading Configuration</h3>
                    <p>{configData.error.message || 'Failed to load configuration'}</p>
                    <button onClick={() => configData.refetch()}>
                        <Icon icon="mdi:refresh" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }
    
    if (!config) {
        return (
            <div className="event-system-config">
                <div className="no-config">
                    <Icon icon="mdi:cog" />
                    <h3>No Configuration Found</h3>
                    <p>System configuration will be created automatically when you make your first change.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="event-system-config">
            <div className="config-header">
                <div className="header-content">
                    <h1>Event System Configuration</h1>
                    <p>Configure global settings, domains, templates, and integrations for the event management system</p>
                </div>
                <div className="header-actions">
                    {hasChanges && (
                        <button className="save-btn" onClick={handleSave}>
                            <Icon icon="mdi:content-save" />
                            Save Changes
                        </button>
                    )}
                    <button 
                        className="reset-btn" 
                        onClick={handleReset}
                        disabled={!hasChanges}
                    >
                        <Icon icon="mdi:refresh" />
                        Reset
                    </button>
                </div>
            </div>
            
            <div className="config-tabs">
                <button 
                    className={`tab ${activeTab === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveTab('system')}
                >
                    <Icon icon="mdi:cog" />
                    System Settings
                </button>
                <button 
                    className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
                    onClick={() => setActiveTab('domains')}
                >
                    <Icon icon="mdi:domain" />
                    Domains
                </button>
                <button 
                    className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    <Icon icon="mdi:file-document-multiple" />
                    Templates
                </button>
                <button 
                    className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('integrations')}
                >
                    <Icon icon="mdi:connection" />
                    Integrations
                </button>
                <button 
                    className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <Icon icon="mdi:chart-line" />
                    Analytics
                </button>
            </div>
            
            <div className="config-content">
                {activeTab === 'system' && (
                    <SystemSettings
                        config={config.systemSettings}
                        onChange={(updates) => handleConfigChange('systemSettings', updates)}
                    />
                )}
                
                {activeTab === 'domains' && (
                    <DomainManager
                        domains={config.domains}
                        onChange={(domains) => handleConfigChange('domains', domains)}
                    />
                )}
                
                {activeTab === 'templates' && (
                    <TemplateManager
                        templates={config.eventTemplates}
                        onChange={(templates) => handleConfigChange('eventTemplates', templates)}
                    />
                )}
                
                {activeTab === 'integrations' && (
                    <IntegrationManager
                        integrations={config.integrations}
                        onChange={(integrations) => handleConfigChange('integrations', integrations)}
                    />
                )}
                
                {activeTab === 'analytics' && (
                    <AnalyticsConfig
                        analytics={config.analytics}
                        onChange={(analytics) => handleConfigChange('analytics', analytics)}
                    />
                )}
            </div>
        </div>
    );
};

export default EventSystemConfig;

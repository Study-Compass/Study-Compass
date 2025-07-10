import React, { useState, useEffect } from 'react';
import './OrgSettings.scss';
import { Icon } from '@iconify-icon/react';
import { useNotification } from '../../../NotificationContext';
import useAuth from '../../../hooks/useAuth';
import apiRequest from '../../../utils/postRequest';
import { 
    GeneralSettings, 
    AppearanceSettings, 
    RolesSettings, 
    DangerZone 
} from './components';
import OrgGrad from '../../../assets/Gradients/OrgGrad.png';

function Settings({ expandedClass, org }) {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [canManageSettings, setCanManageSettings] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [permissionsChecked, setPermissionsChecked] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        org_name: '',
        org_description: '',
        org_profile_image: '',
        weekly_meeting: '',
        positions: []
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    // Settings sections
    const [activeSection, setActiveSection] = useState('general');

    useEffect(() => {
        if (org && !permissionsChecked) {
            checkUserPermissions();
            initializeFormData();
        }
    }, [org, user, permissionsChecked]);

    const checkUserPermissions = async () => {
        if (!org || !user) return;

        try {
            // Check if user is the owner
            const isOwner = org.owner === user._id;
            
            if (isOwner) {
                setCanManageSettings(true);
                setHasAccess(true);
                setPermissionsChecked(true);
                return;
            }

            // Get user's role in this organization
            const response = await apiRequest(`/org-roles/${org._id}/members`, {}, {
                method: 'GET'
            });

            if (response.success) {
                const userMember = response.members.find(member => 
                    member.user_id._id === user._id
                );

                if (userMember) {
                    const userRoleData = org.positions.find(role => role.name === userMember.role);
                    
                    if (userRoleData) {
                        const canManageContent = userRoleData.canManageContent || 
                                                userRoleData.permissions.includes('manage_content') || 
                                                userRoleData.permissions.includes('all');
                        
                        setCanManageSettings(canManageContent);
                        setHasAccess(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
            setHasAccess(false);
            setCanManageSettings(false);
        } finally {
            setPermissionsChecked(true);
        }
    };

    const initializeFormData = () => {
        if (org) {
            setFormData({
                org_name: org.org_name || '',
                org_description: org.org_description || '',
                org_profile_image: org.org_profile_image || '',
                weekly_meeting: org.weekly_meeting || '',
                positions: org.positions || []
            });
            setImagePreview(org.org_profile_image || '');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRolesChange = (newRoles) => {
        setFormData(prev => ({
            ...prev,
            positions: newRoles
        }));
    };

    const handleSave = async () => {
        if (!canManageSettings) {
            addNotification({
                title: 'Error',
                message: 'You don\'t have permission to manage organization settings',
                type: 'error'
            });
            return;
        }

        setSaving(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('orgId', org._id);
            formDataToSend.append('org_name', formData.org_name);
            formDataToSend.append('org_description', formData.org_description);
            formDataToSend.append('weekly_meeting', formData.weekly_meeting);
            formDataToSend.append('positions', JSON.stringify(formData.positions));

            if (selectedFile) {
                formDataToSend.append('image', selectedFile);
            }

            const response = await apiRequest('/edit-org', formDataToSend, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: 'Organization settings updated successfully',
                    type: 'success'
                });
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            addNotification({
                title: 'Error',
                message: error.message || 'Failed to save settings',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteOrg = async () => {
        if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiRequest(`/delete-org/${org._id}`, {}, {
                method: 'DELETE'
            });

            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: 'Organization deleted successfully',
                    type: 'success'
                });
                // Redirect to home or dashboard
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error deleting organization:', error);
            addNotification({
                title: 'Error',
                message: error.message || 'Failed to delete organization',
                type: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className={`dash ${expandedClass}`}>
                <div className="settings loading">
                    <div className="loader">Loading settings...</div>
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className={`dash ${expandedClass}`}>
                <div className="settings">
                    <header className="header">
                        <h1>Organization Settings</h1>
                        <p>Manage settings for {org?.org_name}</p>
                    </header>

                    <div className="permission-warning">
                        <p>You don't have access to this organization's settings.</p>
                        <p>You must be a member with appropriate permissions to view settings.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`dash ${expandedClass}`}>
            <div className="org-settings">
                <header className="header">
                    <h1>Organization Settings</h1>
                    <p>Manage settings for {org?.org_name}</p>
                </header>

                <div className="settings-container">
                    <div className="settings-sidebar">
                        <div className="sidebar-section">
                            <h3>Settings</h3>
                            <button 
                                className={`sidebar-item ${activeSection === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveSection('general')}
                            >
                                <Icon icon="mdi:cog" />
                                <span>General</span>
                            </button>
                            <button 
                                className={`sidebar-item ${activeSection === 'appearance' ? 'active' : ''}`}
                                onClick={() => setActiveSection('appearance')}
                            >
                                <Icon icon="mdi:palette" />
                                <span>Appearance</span>
                            </button>
                            <button 
                                className={`sidebar-item ${activeSection === 'roles' ? 'active' : ''}`}
                                onClick={() => setActiveSection('roles')}
                            >
                                <Icon icon="mdi:shield-account" />
                                <span>Roles & Permissions</span>
                            </button>
                            <button 
                                className={`sidebar-item ${activeSection === 'danger' ? 'active' : ''}`}
                                onClick={() => setActiveSection('danger')}
                            >
                                <Icon icon="mdi:alert-circle" />
                                <span>Danger Zone</span>
                            </button>
                        </div>
                    </div>

                    <div className="settings-content">
                        {activeSection === 'general' && (
                            <GeneralSettings
                                formData={formData}
                                handleInputChange={handleInputChange}
                                canManageSettings={canManageSettings}
                                handleSave={handleSave}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'appearance' && (
                            <AppearanceSettings
                                imagePreview={imagePreview}
                                handleFileSelect={handleFileSelect}
                                canManageSettings={canManageSettings}
                                handleSave={handleSave}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'roles' && (
                            <RolesSettings
                                formData={formData}
                                handleRolesChange={handleRolesChange}
                                canManageSettings={canManageSettings}
                                handleSave={handleSave}
                                saving={saving}
                            />
                        )}

                        {activeSection === 'danger' && (
                            <DangerZone
                                handleDeleteOrg={handleDeleteOrg}
                                canManageSettings={canManageSettings}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings; 
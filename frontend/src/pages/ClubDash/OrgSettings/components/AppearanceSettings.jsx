import React, { useState, useEffect } from 'react';
import ImageUpload from '../../../../components/ImageUpload/ImageUpload';
import { useOrgPermissions, useOrgSave } from './settingsHelpers';
import './AppearanceSettings.scss';
import OrgGrad from '../../../../assets/Gradients/OrgGrad.png';

const AppearanceSettings = ({ org, expandedClass }) => {
    const [formData, setFormData] = useState({
        org_name: '',
        org_description: '',
        org_profile_image: '',
        weekly_meeting: '',
        positions: []
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [permissionsChecked, setPermissionsChecked] = useState(false);
    const [canManageSettings, setCanManageSettings] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    const { checkUserPermissions } = useOrgPermissions(org);
    const { saveOrgSettings } = useOrgSave(org);

    useEffect(() => {
        if (org && !permissionsChecked) {
            initializePermissions();
            initializeFormData();
        }
    }, [org, permissionsChecked]);

    const initializePermissions = async () => {
        const permissions = await checkUserPermissions();
        setCanManageSettings(permissions.canManageSettings);
        setHasAccess(permissions.hasAccess);
        setPermissionsChecked(true);
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

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!canManageSettings) {
            return;
        }

        setSaving(true);
        try {
            const success = await saveOrgSettings(formData, selectedFile);
            if (success) {
                setSelectedFile(null);
                // Optionally refresh the org data or update local state
                initializeFormData();
            }
        } finally {
            setSaving(false);
        }
    };

    if (!hasAccess) {
        return (
            <div className={`dash ${expandedClass}`}>
                <div className="settings-section">
                    <h2>Appearance</h2>
                    <div className="permission-warning">
                        <p>You don't have access to this organization's settings.</p>
                        <p>You must be a member with appropriate permissions to view settings.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dash settings-section">
            <header className="header">
                <h1>Appearance</h1>
                <p>Customize your organization's visual identity</p>
                <img src={OrgGrad} alt="" />
            </header>
            <div className="settings-content">
                <div className="form-group">
                    <label>Profile Picture</label>
                    <div className="current-image">
                        <img 
                            src={imagePreview || '/Logo.svg'} 
                            alt="Organization profile" 
                        />
                    </div>
                    <ImageUpload
                        onFileSelect={handleFileSelect}
                        uploadText="Upload new profile picture"
                        maxSize={5}
                        showPrompt={true}
                    />
                </div>

                {canManageSettings && (
                    <button 
                        className="save-button" 
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default AppearanceSettings; 
import React, { useState, useEffect } from 'react';
import { useOrgPermissions, useOrgSave } from './settingsHelpers';
import OrgGrad from '../../../../assets/Gradients/OrgGrad.png';


const GeneralSettings = ({ org, expandedClass }) => {
    const [formData, setFormData] = useState({
        org_name: '',
        org_description: '',
        org_profile_image: '',
        weekly_meeting: '',
        positions: []
    });
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
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!canManageSettings) {
            return;
        }

        setSaving(true);
        try {
            const success = await saveOrgSettings(formData);
            if (success) {
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
                    <h2>General Settings</h2>
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
                <h1>General Settings</h1>
                <p>Manage basic organization information</p>
                <img src={OrgGrad} alt="" />
            </header>
            <div className="settings-content">
                
                <div className="form-group">
                    <label htmlFor="org_name">Organization Name</label>
                    <input
                        type="text"
                        id="org_name"
                        name="org_name"
                        value={formData.org_name}
                        onChange={handleInputChange}
                        disabled={!canManageSettings}
                        placeholder="Enter organization name"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="org_description">Description</label>
                    <textarea
                        id="org_description"
                        name="org_description"
                        value={formData.org_description}
                        onChange={handleInputChange}
                        disabled={!canManageSettings}
                        placeholder="Describe your organization"
                        rows={4}
                        maxLength={500}
                    />
                    <span className="char-count">{formData.org_description.length}/500</span>
                </div>

                <div className="form-group">
                    <label htmlFor="weekly_meeting">Weekly Meeting Time</label>
                    <input
                        type="text"
                        id="weekly_meeting"
                        name="weekly_meeting"
                        value={formData.weekly_meeting}
                        onChange={handleInputChange}
                        disabled={!canManageSettings}
                        placeholder="e.g., Every Monday at 6 PM"
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

export default GeneralSettings; 
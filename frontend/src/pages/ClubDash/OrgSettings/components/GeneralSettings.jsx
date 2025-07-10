import React from 'react';

const GeneralSettings = ({ 
    formData, 
    handleInputChange, 
    canManageSettings, 
    handleSave, 
    saving 
}) => {
    return (
        <div className="settings-section">
            <h2>General Settings</h2>
            <p>Manage basic organization information</p>

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
    );
};

export default GeneralSettings; 
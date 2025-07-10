import React from 'react';
import RoleManager from '../../../../components/RoleManager';

const RolesSettings = ({ 
    formData, 
    handleRolesChange, 
    canManageSettings, 
    handleSave, 
    saving 
}) => {
    return (
        <div className="settings-section">
            <h2>Roles & Permissions</h2>
            <p>Manage roles and permissions for organization members</p>

            {!canManageSettings && (
                <div className="permission-warning">
                    <p>You don't have permission to manage roles in this organization.</p>
                    <p>Only organization owners and users with role management permissions can modify roles.</p>
                </div>
            )}

            <div className="role-manager-container">
                <RoleManager 
                    roles={formData.positions}
                    onRolesChange={handleRolesChange}
                    isEditable={canManageSettings}
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

export default RolesSettings; 
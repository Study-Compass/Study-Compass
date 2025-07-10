import React from 'react';

const DangerZone = ({ 
    handleDeleteOrg, 
    canManageSettings 
}) => {
    return (
        <div className="settings-section">
            <h2>Danger Zone</h2>
            <p>Irreversible and destructive actions</p>

            <div className="danger-zone">
                <div className="danger-item">
                    <div className="danger-content">
                        <h3>Delete Organization</h3>
                        <p>Permanently delete this organization and all its data. This action cannot be undone.</p>
                    </div>
                    <button 
                        className="delete-button"
                        onClick={handleDeleteOrg}
                        disabled={!canManageSettings}
                    >
                        Delete Organization
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DangerZone; 
import React from 'react';
import ImageUpload from '../../../../components/ImageUpload/ImageUpload';

const AppearanceSettings = ({ 
    imagePreview, 
    handleFileSelect, 
    canManageSettings, 
    handleSave, 
    saving 
}) => {
    return (
        <div className="settings-section">
            <h2>Appearance</h2>
            <p>Customize your organization's visual identity</p>

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
    );
};

export default AppearanceSettings; 
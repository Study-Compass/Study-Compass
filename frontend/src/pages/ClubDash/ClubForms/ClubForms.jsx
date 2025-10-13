import React, { useState, useEffect } from 'react';
import './ClubForms.scss';
import { useFetch } from '../../../hooks/useFetch';
import OrgGrad from '../../../assets/Gradients/OrgGrad.png';
import FormBuilder from '../../../components/FormBuilder/FormBuilder';
import FormViewer from '../../../components/FormViewer/FormViewer';
import Popup from '../../../components/Popup/Popup';
import apiRequest from '../../../utils/postRequest';


const ClubForms = ({ org }) => {
    const { data: formsData, loading, error, refetch } = useFetch(`/${org._id}/forms`);
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [showCopyNotification, setShowCopyNotification] = useState(false);
    const [showFormViewer, setShowFormViewer] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);
    const [viewMode, setViewMode] = useState('view'); // 'view' or 'edit'
    
    // Extract forms from the API response
    const forms = formsData?.forms || [];
    const handleFormSave = async (form) => {
        try {
            console.log('Saving form:', form);
            
            const response = await apiRequest(`/${org._id}/forms`, {
                form: form
            });

            if (response.success) {
                console.log('Form saved successfully:', response.form);
                // Refresh the forms list to show the new form
                refetch();
                setShowFormBuilder(false);
                // You could add a success notification here
            } else {
                console.error('Failed to save form:', response.message || response.error);
                // TODO: Show error notification to user
            }
        } catch (error) {
            console.error('Error saving form:', error);
            // TODO: Show error notification to user
        }
    };

    const handleCopyLink = async (formId) => {
        try {
            const link = `${window.location.origin}/forms/${formId}`; //doesnt work

            await navigator.clipboard.writeText(link);
            
            // Show notification
            setShowCopyNotification(true);
            
            // Hide notification after 2 seconds
            setTimeout(() => {
                setShowCopyNotification(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
            // Fallback for browsers that don't support clipboard API
            alert('Failed to copy link. Please copy manually: ' + `${window.location.origin}/forms/${formId}`);
        }
    };

    const handleOpenForm = (form, mode = 'view') => {
        setCurrentForm(form);
        setViewMode(mode);
        setShowFormViewer(true);
    };

    const handleFormUpdate = async (updatedForm) => {
        try {
            const response = await apiRequest(`/${org._id}/forms/${currentForm._id}`, {
                form: updatedForm
            }, { method: 'PUT' });

            if (response.success) {
                console.log('Form updated successfully:', response.form);
                refetch(); // Refresh the forms list
                setShowFormViewer(false);
                setCurrentForm(null);
            } else {
                console.error('Failed to update form:', response.message || response.error);
            }
        } catch (error) {
            console.error('Error updating form:', error);
        }
    };

    return (
        <div className="club-forms dash">
            {/* Form Builder Popup */}
            <Popup
                title="Create New Form"
                isOpen={showFormBuilder}
                onClose={() => setShowFormBuilder(false)}
                customClassName="wide-content"
                defaultStyling={false}
            >
                <FormBuilder
                    initialForm={{
                        title: `${org.org_name} Form`,
                        description: 'Create a new form for your organization',
                        questions: []
                    }}
                    onSave={handleFormSave}
                />
            </Popup>

            {/* Form Viewer/Editor Popup */}
            <Popup
                title={viewMode === 'edit' ? `Edit: ${currentForm?.title}` : `View: ${currentForm?.title}`}
                isOpen={showFormViewer}
                onClose={() => {
                    setShowFormViewer(false);
                    setCurrentForm(null);
                }}
                customClassName="wide-content"
                defaultStyling={false}
            >
                {currentForm && (
                    <div className="form-viewer-container">
                        {viewMode === 'edit' ? (
                            <FormBuilder
                                initialForm={currentForm}
                                onSave={handleFormUpdate}
                            />
                        ) : (
                            <div className="form-viewer">
                                <div className="form-header">
                                    <h2>{currentForm.title}</h2>
                                    <p>{currentForm.description}</p>
                                </div>
                                <div className="form-actions-bar">
                                    <button 
                                        className="edit-btn"
                                        onClick={() => setViewMode('edit')}
                                    >
                                        Edit Form
                                    </button>
                                    <button 
                                        className="copy-btn"
                                        onClick={() => handleCopyLink(currentForm._id)}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                                <FormViewer form={currentForm} />
                            </div>
                        )}
                    </div>
                )}
            </Popup>

                <header className="header">
                    <h1>Club Forms</h1>
                    <p>Create and manage forms for your club</p>
                    <img src={OrgGrad} alt="" />

                </header>

            <div className="club-forms-or-templates">
                <div className="create-form-header">

                    <div className="club-forms-or-templates-header">   
                        <button>Forms</button>
                        <button>Templates</button>
                    </div>

                    <button onClick={() => setShowFormBuilder(true)}>
                        Create Form
                    </button>
                    
                </div>
                <div className="border"></div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <p>Loading forms...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>Error loading forms: {error.message}</p>
                </div>
            ) : forms.length === 0 ? (
                <div className="no-forms-container">
                    <p>No forms created yet. Create your first form!</p>
                </div>
            ) : (
                <div className="forms-list">
                    {forms.map((form) => (
                        <div key={form._id} className="form-container">
                            <div className="form-body">
                                <h1>{form.title}</h1>
                                <div className="border"></div>
                                <p className="form-date">
                                    Created: {new Date(form.createdAt).toLocaleDateString()}
                                </p>
                                <p className="submission-count">
                                    Submissions: {form.submissionCount || 0}
                                </p>
                                <div className="form-actions">
                                    <button 
                                        onClick={() => handleCopyLink(form._id)}
                                    >
                                        Copy Link
                                    </button>
                                    <button onClick={() => handleOpenForm(form, 'view')}>
                                        Open
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Copy Link Notification */}
            {showCopyNotification && (
                <div className="copy-notification">
                    <div className="notification-content">
                        <span>✓ Link copied successfully!</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClubForms;
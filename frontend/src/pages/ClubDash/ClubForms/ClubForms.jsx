import React, { useState, useEffect } from 'react';
import './ClubForms.scss';
import { useFetch } from '../../../hooks/useFetch';
import OrgGrad from '../../../assets/Gradients/OrgGrad.png';
import FormBuilder from '../../../components/FormBuilder/FormBuilder';
import Popup from '../../../components/Popup/Popup';
import apiRequest from '../../../utils/postRequest';


const ClubForms = ({ org }) => {
    const { data: forms, loading, error } = useFetch(`/${org._id}/forms`);
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const handleFormSave = async (form) => {
        try {
            console.log('Saving form:', form);
            
            const response = await apiRequest(`/${org._id}/forms`, {
                form: form
            });

            if (response.success) {
                console.log('Form saved successfully:', response.form);
                // TODO: Refresh the forms list or add the new form to the local state
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

    return (
        <div className="club-forms dash">
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

            <div className="form-container">
        
                <div className="form-body">
                    <h1>Title of the form</h1>
                    <div className="border"></div>
                    <p className="form-date">Created:</p>
                    <p># of submission</p>
                    <div className="form-actions">
                        <button>Copy Link</button>
                        <button>Open</button>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}

export default ClubForms;
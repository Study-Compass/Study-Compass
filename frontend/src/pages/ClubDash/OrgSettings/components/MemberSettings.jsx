import React, {useState, useEffect} from 'react';
import './MemberSettings.scss';
import { useGradient } from '../../../../hooks/useGradient';
import FormBuilder from '../../../../components/FormBuilder/FormBuilder';
import FormViewer from '../../../../components/FormViewer/FormViewer';
import apiRequest from '../../../../utils/postRequest';
import { useOrgPermissions, useOrgSave } from './settingsHelpers';
import SlideSwitch from '../../../../components/SlideSwitch/SlideSwitch';
import Popup from '../../../../components/Popup/Popup';
import FormPreview from '../../../../components/FormPreview/FormPreview';
import UnsavedChangesBanner from '../../../../components/UnsavedChangesBanner/UnsavedChangesBanner';
import useUnsavedChanges from '../../../../hooks/useUnsavedChanges';

function MemberSettings({org}){
    const [formData, setFormData] = useState({
        requireApprovalForJoin: org.requireApprovalForJoin,
        memberForm: org.memberForm ? org.memberForm : null,
    });
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [showFormViewer, setShowFormViewer] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);
    const {AtlasMain} = useGradient();
    const { checkUserPermissions } = useOrgPermissions(org);
    const { saveOrgSettings } = useOrgSave(org);

    // Original data for comparison
    const originalData = {
        requireApprovalForJoin: org.requireApprovalForJoin,
        memberForm: org.memberForm ? org.memberForm : null,
    };

    const handleSave = async () => {
        console.log(formData);
        if(formData.memberForm){
            var formWithoutNewIds = {
                ...formData.memberForm,
                questions: formData.memberForm.questions.map(q => {
                    if(q._id.startsWith('NEW_QUESTION_')){
                        delete q._id;
                        return q;
                    }
                    return q;
                })
            }
            console.log(formWithoutNewIds);
        }
        
        const success = await saveOrgSettings({
            requireApprovalForJoin: formData.requireApprovalForJoin,
            memberForm: formData.memberForm ? formWithoutNewIds : null,
        });
        
        return success;
    };

    const handleDiscard = () => {
        // Reset to original values
        setFormData({
            requireApprovalForJoin: org.requireApprovalForJoin,
            memberForm: org.memberForm ? org.memberForm : null,
        });
    };

    const { hasChanges, saving, handleSave: saveChanges, handleDiscard: discardChanges } = useUnsavedChanges(
        originalData,
        formData,
        handleSave,
        handleDiscard
    );

    const onFormSave = (form) => {
        //remove id attributes
        setFormData({...formData, memberForm: form});
        console.log(form);
    }

    const handleToggleApproval = () => {
        setFormData({...formData, requireApprovalForJoin: !formData.requireApprovalForJoin});
    }

    return (
        <div className="member-settings dash">
            <UnsavedChangesBanner
                hasChanges={hasChanges}
                onSave={saveChanges}
                onDiscard={discardChanges}
                saving={saving}
            />

            <Popup
                title="Member Form"
                isOpen={showFormBuilder}
                onClose={() => setShowFormBuilder(false)}
                customClassName="wide-content"
                defaultStyling={false}
            >
                <FormBuilder
                    initialForm={formData.memberForm ? formData.memberForm : {title: `${org.org_name} Member Form`, description: 'any prospective members will need to fill out this form, and their form responses will be added to the approval process', questions: []}}
                    onSave={onFormSave}
                />
            </Popup>
            <header className="header">
                <h1>Member Settings</h1>
                <p>Customize your organization's member settings</p>
                <img src={AtlasMain} alt="" />
            </header>
            <div className="member-settings-container">
                <div className="settings-list">
                    <div className="setting-child">
                        <div className="content">
                            <h4>Require Approval to Join</h4>
                            <p>Require approval for new members to join the organization</p>
                        </div>
                        <div className="action">
                            <SlideSwitch
                                checked={formData.requireApprovalForJoin}
                                onChange={handleToggleApproval}
                            />
                        </div>
                    </div>
                    {
                        formData.requireApprovalForJoin && (                        
                            <div className="setting-child">
                                <div className="content">
                                    <h4>Member Form (Optional)</h4>
                                    <p>Customize the member form for new members, this will be used to collect information from new members</p>
                                </div>
                                <div className="action">
                                    {
                                        formData.memberForm ? (
                                            <>
                                                <FormPreview form={formData.memberForm} />
                                                <button className="btn" onClick={() => setShowFormBuilder(true)}>Edit</button>
                                            </>
                                        ) : (
                                            <button className="btn" onClick={() => setShowFormBuilder(true)}>Create</button>
                                        )
                                    }
                                </div>
                            </div>
                        )
                    }
                    <div className="setting-child">
                        <div className="content">
                            <h4>Member Renewal Process</h4>
                            <p>Customize the member renewal process for existing members</p>
                        </div>
                        <div className="action">
                            <button className="btn" onClick={() => setShowFormBuilder(true)}>Edit</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default MemberSettings;
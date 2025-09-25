import React, { useState } from 'react';
import './NewApproval.scss';
import Flag from '../../../../components/Flag/Flag';
import postRequest from '../../../../utils/postRequest';
import { UserSearch, SelectedUsers } from '../../../../components/UserSearch';
import { useNotification } from '../../../../NotificationContext';
import HeaderContainer from '../../../../components/HeaderContainer/HeaderContainer';

function NewApproval({refetch, handleClose, refetchFlow}){
    const [approvalName, setApprovalName] = useState('');
    const [approvalDescription, setApprovalDescription] = useState('');
    const [selectedOwner, setSelectedOwner] = useState(null);
    const { addNotification } = useNotification();

    const handleOwnerSelect = (user) => {
        setSelectedOwner(user);
    };

    const handleRemoveOwner = () => {
        setSelectedOwner(null);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (!approvalName.trim()) {
            addNotification({
                title: 'Missing information',
                message: 'Please enter an approval group name',
                type: 'error'
            });
            return;
        }
        
        if (!approvalDescription.trim()) {
            addNotification({
                title: 'Missing information',
                message: 'Please enter an approval group description',
                type: 'error'
            });
            return;
        }
        
        if (!selectedOwner) {
            addNotification({
                title: 'Missing information',
                message: 'Please select an owner for the approval group',
                type: 'error'
            });
            return;
        }
        
        try {
            const response = await postRequest('/approval-groups', {
                name: approvalName,
                displayName: approvalName,
                description: approvalDescription,
                ownerId: selectedOwner._id
            });
            
            if (response.success) {
                // Add the approval group to the approval flow
                try {
                    const flowResponse = await postRequest('/add-approval', {
                        orgId: response.data._id,
                        role: 'admin' // Default role for the approval group
                    });
                    
                    if (flowResponse.success) {
                        addNotification({
                            title: 'Success',
                            message: 'Approval group created and added to flow successfully',
                            type: 'success'
                        });
                    } else {
                        addNotification({
                            title: 'Partial Success',
                            message: 'Approval group created but failed to add to flow',
                            type: 'warning'
                        });
                    }
                } catch (flowError) {
                    console.error('Error adding to approval flow:', flowError);
                    addNotification({
                        title: 'Partial Success',
                        message: 'Approval group created but failed to add to flow',
                        type: 'warning'
                    });
                }
                                
                // Reset form
                setApprovalName('');
                setApprovalDescription('');
                setSelectedOwner(null);
                refetch();
                if(refetchFlow) refetchFlow();
                handleClose();
            } else {
                addNotification({
                    title: 'Error',
                    message: response.message || 'Failed to create approval group',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error creating approval group:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to create approval group',
                type: 'error'
            });
        }
    };

    return (
        <HeaderContainer classN="new-approval" icon="fluent:flowchart-24-filled" header="New Approval Group" subHeader="create a new approval group">
            <div className="header">
                <h2>New Approval Group</h2>
                <p>create a new approval group</p>
            </div>
            <Flag 
                text="Approval groups can manage their own members and configure approval rules. The selected owner will have full control over the group." 
                primary="rgba(235,226,127,0.32)" 
                accent='#B29F5F' 
                color="#B29F5F" 
                icon={'lets-icons:info-alt-fill'}
            />
            <form onSubmit={onSubmit} className="content">
                <div className="field">
                    <label htmlFor="approval-name">Approval Group Name</label>
                    <input 
                        type="text" 
                        name="approval-name" 
                        id="approval-name" 
                        className="short" 
                        value={approvalName} 
                        onChange={(e) => setApprovalName(e.target.value)}
                        placeholder="Enter approval group name"
                    />
                </div>
                <div className="field">
                    <label htmlFor="approval-description">Description</label>
                    <textarea 
                        name="approval-description" 
                        id="approval-description" 
                        className="long" 
                        value={approvalDescription} 
                        onChange={(e) => setApprovalDescription(e.target.value)}
                        placeholder="Describe the purpose of this approval group"
                        rows="3"
                    />
                </div>
                <div className="field">
                    <label htmlFor="owner-search">Select Owner</label>
                    <UserSearch 
                        onUserSelect={handleOwnerSelect}
                        placeholder="Search for the owner by name or username"
                        excludeIds={selectedOwner ? [selectedOwner._id] : []}
                    />
                    {selectedOwner && (
                        <div className="selected-owner">
                            <div className="owner-info">
                                <span className="owner-name">{selectedOwner.name || selectedOwner.username}</span>
                                <span className="owner-email">{selectedOwner.email}</span>
                            </div>
                            <button 
                                type="button" 
                                className="remove-owner" 
                                onClick={handleRemoveOwner}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>
                <button type="submit" className="submit-button">
                    Create Approval Group
                </button>
            </form>
        </HeaderContainer>
    );
}

export default NewApproval;
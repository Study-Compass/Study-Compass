import React, { useState } from 'react';
import './NewApproval.scss';
import Flag from '../../../../components/Flag/Flag';
import postRequest from '../../../../utils/postRequest';
import { UserSearch, SelectedUsers } from '../../../../components/UserSearch';
import { useNotification } from '../../../../NotificationContext';
import HeaderContainer from '../../../../components/HeaderContainer/HeaderContainer';

function NewApproval({refetch, handleClose}){
    const [approvalName, setApprovalName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const { addNotification } = useNotification();

    const handleUserSelect = (user) => {
        // Check if user is already selected
        if (selectedUsers.some(selectedUser => selectedUser._id === user._id)) {
            addNotification({
                title: 'User already selected',
                message: `${user.username} is already in the list`,
                type: 'info'
            });
            return;
        }
        
        setSelectedUsers([...selectedUsers, user]);
    };

    const handleRemoveUser = (user) => {
        setSelectedUsers(selectedUsers.filter(selectedUser => selectedUser._id !== user._id));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (!approvalName.trim()) {
            addNotification({
                title: 'Missing information',
                message: 'Please enter an approval name',
                type: 'error'
            });
            return;
        }
        
        if (selectedUsers.length === 0) {
            addNotification({
                title: 'Missing information',
                message: 'Please select at least one user',
                type: 'error'
            });
            return;
        }
        
        const usernames = selectedUsers.map(user => user.username);
        
        try {
            const response = await postRequest('/add-approval', {
                role: approvalName,
                usernames: usernames
            });
            
            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: 'Approval role created successfully',
                    type: 'success'
                });
                                
                // Reset form
                setApprovalName('');
                setSelectedUsers([]);
                refetch();
                handleClose();
            } else {
                addNotification({
                    title: 'Error',
                    message: response.message || 'Failed to create approval role',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error creating approval role:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to create approval role',
                type: 'error'
            });
        }
    };

    return (
        <HeaderContainer classN="new-approval" icon="fluent:flowchart-24-filled" header="New Approval Role" subHeader="create a new approval">
            <div className="header">
                <h2>New Approval Role</h2>
                <p>create a new approval</p>
            </div>
            <Flag 
                text="Administrators with this role will be prompted to create their own criteria and approval process." 
                primary="rgba(235,226,127,0.32)" 
                accent='#B29F5F' 
                color="#B29F5F" 
                icon={'lets-icons:info-alt-fill'}
            />
            <form onSubmit={onSubmit} className="content">
                <div className="field">
                    <label htmlFor="approval-name">Approval Name</label>
                    <input 
                        type="text" 
                        name="approval-name" 
                        id="approval-name" 
                        className="short" 
                        value={approvalName} 
                        onChange={(e) => setApprovalName(e.target.value)}
                        placeholder="Enter approval role name"
                    />
                </div>
                <div className="field">
                    <label htmlFor="user-search">Add Users</label>
                    <UserSearch 
                        onUserSelect={handleUserSelect}
                        placeholder="Search for users by name or username"
                        excludeIds={selectedUsers.map(user => user._id)}
                    />
                    <SelectedUsers 
                        users={selectedUsers}
                        onRemoveUser={handleRemoveUser}
                    />
                </div>
                <button type="submit" className="submit-button">
                    Create Approval Role
                </button>
            </form>
        </HeaderContainer>
    );
}

export default NewApproval;
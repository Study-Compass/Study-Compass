import React, { useState, useEffect } from 'react';
import './Roles.scss';
import RoleManager from '../../../components/RoleManager';
import { useNotification } from '../../../NotificationContext';
import useAuth from '../../../hooks/useAuth';
import axios from 'axios';
import apiRequest from '../../../utils/postRequest';

function Roles({ expandedClass, org }) {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canManageRoles, setCanManageRoles] = useState(false);

    useEffect(() => {
        if (org) {
            setRoles(org.positions || []);
            
            // Check if user can manage roles
            const isOwner = org.owner === user._id;
            const hasRoleManagement = org.positions?.some(role => 
                role.name === 'owner' || 
                (role.canManageRoles && user.roles?.includes('admin'))
            );
            
            setCanManageRoles(isOwner || hasRoleManagement);
            setLoading(false);
        }
    }, [org, user]);

    const handleRolesChange = async (newRoles) => {
        try {
            // Update roles on the backend
            const response = await apiRequest(`/org-roles/${org._id}/roles`, {
                positions: newRoles
            }, {
                method: 'PUT'
            });

            if (response.success) {
                setRoles(newRoles);
                addNotification({
                    title: 'Success',
                    message: 'Roles updated successfully',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error updating roles:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to update roles',
                type: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className={`dash ${expandedClass}`}>
                <div className="roles loading">
                    <div className="loader">Loading roles...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`dash ${expandedClass}`}>
            <div className="roles">
                <div className="header">
                    <h1>Role Management</h1>
                    <p>Manage roles and permissions for {org.org_name}</p>
                </div>

                {!canManageRoles && (
                    <div className="permission-warning">
                        <p>You don't have permission to manage roles in this organization.</p>
                    </div>
                )}

                <div className="role-manager-container">
                    <RoleManager 
                        roles={roles}
                        onRolesChange={handleRolesChange}
                        isEditable={canManageRoles}
                    />
                </div>
            </div>
        </div>
    );
}

export default Roles; 
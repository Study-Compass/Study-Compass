import React, { useState, useEffect } from 'react';
import './Members.scss';
import { useNotification } from '../../../NotificationContext';
import useAuth from '../../../hooks/useAuth';
import { useFetch } from '../../../hooks/useFetch';
import apiRequest from '../../../utils/postRequest';
import OrgGrad from '../../../assets/Gradients/OrgGrad.png';
import { Icon } from '@iconify-icon/react';
import Popup from '../../../components/Popup/Popup';
import Modal from '../../../components/Modal/Modal';
import AddMemberForm from '../../../components/AddMemberForm';
import { getOrgRoleColor } from '../../../utils/orgUtils';
import Select from '../../../components/Select/Select'; 
import MemberApplicationsViewer from './MemberApplicationsViewer/MemberApplicationsViewer';

function Members({ expandedClass, org }) {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [roles, setRoles] = useState([]);
    const [canManageMembers, setCanManageMembers] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [permissionsChecked, setPermissionsChecked] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showRoleAssignment, setShowRoleAssignment] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showApplicationsViewer, setShowApplicationsViewer] = useState(false);

    // Use useFetch for members data
    const { data: membersData, loading: membersLoading, error: membersError, refetch: refetchMembers } = useFetch(
        org ? `/org-roles/${org._id}/members` : null,
    );

    // Extract members and applications from the fetched data
    const members = membersData?.members || [];
    const applications = membersData?.applications || [];

    useEffect(() => {
        if (org && !permissionsChecked) {
            console.log('Members component - org data:', org);
            console.log('Members component - user data:', user);
            setRoles(org.positions || []);
            checkUserPermissions();
        }
    }, [org, user, permissionsChecked]);

    useEffect(() => {
        // Handle members fetch error
        if (membersError) {
            console.error('Error fetching members:', membersError);
            addNotification({
                title: 'Error',
                message: 'Failed to fetch members',
                type: 'error'
            });
        }
    }, [membersError, addNotification]);

    const checkUserPermissions = async () => {
        if (!org || !user || permissionsChecked) return;

        try {
            // Check if user is the owner
            const isOwner = org.owner === user._id;
            
            if (isOwner) {
                setUserRole('owner');
                setCanManageMembers(true);
                setHasAccess(true);
                setPermissionsChecked(true);
                return;
            }

            // Get user's role in this organization
            const response = await apiRequest(`/org-roles/${org._id}/members`, {}, {
                method: 'GET'
            });

            if (response.success) {
                const userMember = response.members.find(member => 
                    member.user_id._id === user._id
                );

                if (userMember) {
                    setUserRole(userMember.role);
                    
                    // Check if user's role has permission to manage members
                    const userRoleData = org.positions.find(role => role.name === userMember.role);
                    
                    if (userRoleData) {
                        const canManage = userRoleData.canManageMembers || userRoleData.permissions.includes('manage_members') || userRoleData.permissions.includes('all');
                        setCanManageMembers(canManage);
                        setHasAccess(true);
                    } else {
                        setCanManageMembers(false);
                        setHasAccess(true);
                    }
                } else {
                    // User is not a member of this organization
                    setHasAccess(false);
                    setCanManageMembers(false);
                }
            } else {
                console.error('Failed to fetch user membership:', response.message);
                setHasAccess(false);
                setCanManageMembers(false);
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
            setHasAccess(false);
            setCanManageMembers(false);
        } finally {
            setPermissionsChecked(true);
        }
    };

    const handleRoleAssignment = async (memberId, newRole, reason = '') => {
        if (!canManageMembers) {
            addNotification({
                title: 'Error',
                message: 'You don\'t have permission to manage members',
                type: 'error'
            });
            return;
        }

        try {
            const response = await apiRequest(`/org-roles/${org._id}/members/${memberId}/role`, {
                role: newRole,
                reason: reason
            }, {
                method: 'POST'
            });

            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: 'Role assigned successfully',
                    type: 'success'
                });
                refetchMembers(); // Refresh member list using useFetch refetch
                setShowRoleAssignment(false);
                setSelectedMember(null);
            }
        } catch (error) {
            console.error('Error assigning role:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to assign role',
                type: 'error'
            });
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!canManageMembers) {
            addNotification({
                title: 'Error',
                message: 'You don\'t have permission to manage members',
                type: 'error'
            });
            return;
        }

        if (!window.confirm('Are you sure you want to remove this member from the organization?')) {
            return;
        }

        try {
            const response = await apiRequest(`/org-roles/${org._id}/members/${memberId}`, {}, {
                method: 'DELETE'
            });

            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: 'Member removed successfully',
                    type: 'success'
                });
                refetchMembers(); // Refresh member list using useFetch refetch
            }
        } catch (error) {
            console.error('Error removing member:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to remove member',
                type: 'error'
            });
        }
    };

    const handleMemberAdded = () => {
        refetchMembers(); // Refresh member list using useFetch refetch
    };

    const handleCloseAddMember = () => {
        setShowAddMember(false);
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = member.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.user_id?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        
        return matchesSearch && matchesRole;
    });

    const getRoleDisplayName = (roleName) => {
        const role = roles.find(r => r.name === roleName);
        return role ? role.displayName : roleName;
    };

    const getRoleColor = (roleName) => {
        const roleColors = {
            'owner': '#dc2626',
            'admin': '#ea580c',
            'officer': '#d97706',
            'member': '#059669'
        };
        return roleColors[roleName] || '#6b7280';
    };

    if (membersLoading) {
        return (
            <div className={`dash ${expandedClass}`}>
                <div className="members loading">
                    <div className="loader">Loading members...</div>
                </div>
            </div>
        );
    }

    // If user doesn't have access to this organization
    if (!hasAccess) {
        return (
            <div className={`dash ${expandedClass}`}>
                <div className="members">
                    <header className="header">
                        <h1>Member Management</h1>
                        <p>Manage members and assign roles for {org.org_name}</p>
                        <img src={OrgGrad} alt="" />
                    </header>

                    <div className="permission-warning">
                        <p>You don't have access to this organization's member management.</p>
                        <p>You must be a member of this organization to view member information.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`dash ${expandedClass}`}>
            <Popup 
                isOpen={showApplicationsViewer} 
                onClose={() => {refetchMembers(); setShowApplicationsViewer(false)}}
                customClassName="wide-content"
                defaultStyling={false}
                popout={false}
            >
                <MemberApplicationsViewer org={org} />
            </Popup>
            <div className="members">
                <header className="header">
                    <h1>Member Management</h1>
                    <p>Manage members and assign roles for {org.org_name}</p>
                    <img src={OrgGrad} alt="" />
                </header>

                {/* <div className="user-role-info">
                    <p>Your role: <span className="role-badge">{userRole}</span></p>
                </div> */}

                {!canManageMembers && (
                    <div className="permission-warning">
                        <p>You don't have permission to manage members in this organization.</p>
                        <p>Only organization owners and users with member management permissions can modify member roles.</p>
                    </div>
                )}

                <div className="member-management-container">
                    {/* search and filter */}
                    <div className="controls">
                        <div className="search-filter">
                            <div className="search-box">
                                <Icon icon="ic:round-search" className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-dropdown">
                                <Select
                                    options={['All Roles', ...roles.map(role => role.displayName)]}
                                    onChange={(value) => setFilterRole(value === 'All Roles' ? 'all' : roles.find(role => role.displayName === value).name)}
                                    defaultValue="All Roles"
                                />
                            </div>
                            <button className="view-applications-btn" onClick={() => setShowApplicationsViewer(true)}>
                                View Applications <b>{applications.length}</b>
                            </button>
                                
                        </div>
                        
                        {canManageMembers && (
                            <button 
                                className="add-member-btn"
                                onClick={() => setShowAddMember(true)}
                            >
                                <Icon icon="ic:round-add" />
                                Add Member
                            </button>
                        )}
                    </div>

                    <div className="members-list">
                        {
                            filteredMembers.length > 0 ? (
                                <div className="members-list-header">
                                    <h3>Name</h3>
                                    <h3></h3>
                                    <h3>Joined</h3>
                                    <h3>Role</h3>
                                    <h3>Actions</h3>
                                </div>
                            ) : (
                                <div className="members-list-header">

                                </div>
                            )
                        }
                        {filteredMembers.length === 0 ? (
                            <div className="no-members">
                                <Icon icon="mdi:account-group-outline" className="no-members-icon" />
                                <p>No members found</p>
                                {searchTerm || filterRole !== 'all' ? (
                                    <button 
                                        className="clear-filters-btn"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterRole('all');
                                        }}
                                    >
                                        Clear Filters
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            filteredMembers.map(member => (
                                <div key={member._id} className="member-card">
                                    {/* <div className="member-info"> */}
                                        <div className="member-avatar">
                                            {member.user_id?.picture ? (
                                                <img src={member.user_id.picture} alt={member.user_id.name} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {member.user_id?.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-details">
                                            <h4>{member.user_id?.name || 'Unknown User'}</h4>
                                            {/* <p className="username">@{member.user_id?.username || 'unknown'}</p> */}
                                            <p className="email">{member.user_id?.email || 'No email'}</p>
                                        </div>
                                        <div className="member-meta">
                                            <span className="joined-date">
                                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                                            </span>
                                            {member.assignedBy && (
                                                <span className="assigned-by">
                                                    Assigned by {member.assignedBy?.name || 'Unknown'}
                                                </span>
                                            )}
                                        </div>
                                    {/* </div> */}
                                    
                                    {/* <div className="member-actions"> */}
                                        <div className="role-badge" style={{ backgroundColor: getOrgRoleColor(member.role, 0.1), color: getOrgRoleColor(member.role, 1) }}>
                                            {getRoleDisplayName(member.role)}
                                        </div>
                                        
                                        {canManageMembers && (
                                            <div className="action-buttons">
                                                <button 
                                                    className="assign-role-btn"
                                                    onClick={() => {
                                                        setSelectedMember(member);
                                                        setShowRoleAssignment(true);
                                                    }}
                                                    title="Assign Role"
                                                >
                                                    <Icon icon="mdi:shield-account" />
                                                </button>
                                                
                                                {member.role !== 'owner' && (
                                                    <button 
                                                        className="remove-member-btn"
                                                        onClick={() => handleRemoveMember(member.user_id._id)}
                                                        title="Remove Member"
                                                    >
                                                        <Icon icon="mdi:account-remove" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                // </div>
                            ))
                        )}
                    </div>
                </div>

                {/* add member form */}
                <Popup 
                    isOpen={showAddMember} 
                    onClose={handleCloseAddMember}
                    customClassName="add-member-popup"
                >
                    <AddMemberForm 
                        orgId={org._id}
                        roles={roles}
                        existingMembers={members}
                        onMemberAdded={handleMemberAdded}
                        onClose={handleCloseAddMember}
                        addNotification={addNotification}
                    />
                </Popup>

                {/* Role Assignment Modal */}
                <Modal 
                    isOpen={showRoleAssignment} 
                    onClose={() => {
                        setShowRoleAssignment(false);
                        setSelectedMember(null);
                    }}
                    title="Assign Role"
                    size="medium"
                >
                    {selectedMember && (
                        <>
                            <div className="member-summary">
                                <h4>Assigning role for:</h4>
                                <p>{selectedMember.user_id?.name} (@{selectedMember.user_id?.username})</p>
                                <p>Current role: <span style={{ color: getRoleColor(selectedMember.role) }}>
                                    {getRoleDisplayName(selectedMember.role)}
                                </span></p>
                            </div>
                            
                            <div className="role-selection">
                                <h4>Select New Role:</h4>
                                <div className="role-options">
                                    {roles.map(role => (
                                        <button
                                            key={role.name}
                                            className={`role-option ${selectedMember.role === role.name ? 'current' : ''}`}
                                            onClick={() => handleRoleAssignment(selectedMember.user_id._id, role.name)}
                                            disabled={role.name === 'owner' && selectedMember.role !== 'owner'}
                                        >
                                            <div className="role-info">
                                                <h5>{role.displayName}</h5>
                                                <p>{role.permissions.join(', ') || 'No specific permissions'}</p>
                                            </div>
                                            {selectedMember.role === role.name && (
                                                <Icon icon="ic:round-check" className="current-indicator" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </Modal>
            </div>
        </div>
    );
}

export default Members;

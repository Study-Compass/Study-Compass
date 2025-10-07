import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManageFlow.scss';
import { useGradient } from '../../../hooks/useGradient';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import {useFetch} from '../../../hooks/useFetch';
import { useNotification } from '../../../NotificationContext';
import Popup from '../../../components/Popup/Popup';
import NewApproval from './NewApproval/NewApproval';
import NewDomain from './NewDomain/NewDomain';
import NewStakeholderRole from './NewStakeholderRole/NewStakeholderRole';
import FlowCard from './FlowCard/FlowCard';
import FlowAnalytics from './FlowAnalytics/FlowAnalytics';
import postRequest from '../../../utils/postRequest';

function ManageFlow(){
    const navigate = useNavigate();
    const approvalGroupsData = useFetch('/approval-groups');
    const approvalFlowData = useFetch('/api/event-system-config/get-approval-flow');
    const domainsData = useFetch('/api/domains');
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupType, setPopupType] = useState('stakeholder'); // 'stakeholder', 'domain'
    const [activeTab, setActiveTab] = useState('flows');
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [stakeholderRoles, setStakeholderRoles] = useState([]);
    const [loadingStakeholders, setLoadingStakeholders] = useState(false);
    const { addNotification } = useNotification();
    const {BeaconMain} = useGradient();
    const openPopup = (type = 'stakeholder') => {
        setPopupType(type);
        setPopupOpen(true);
    }

    const handleGroupDelete = async (groupId) => {
        if (!window.confirm('Are you sure you want to delete this approval group? This action cannot be undone.')) {
            return;
        }

        try {
            // TODO: Implement group deletion API
            addNotification({
                title: 'Success',
                message: 'Approval group deleted successfully',
                type: 'success'
            });
            approvalGroupsData.refetch();
            approvalFlowData.refetch();
            domainsData.refetch();
        } catch (error) {
            addNotification({
                title: 'Error',
                message: 'Failed to delete approval group',
                type: 'error'
            });
        }
    }

    const handleDomainSelect = async (domainId) => {
        setSelectedDomain(domainId);
        setLoadingStakeholders(true);
        
        try {
            const response = await postRequest(`/api/event-system-config/stakeholder-roles/${domainId}`, {}, {
                method: 'GET'
            });
            
            if (response.success) {
                setStakeholderRoles(response.data);
            } else {
                addNotification({
                    title: 'Error',
                    message: 'Failed to load stakeholder roles',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error loading stakeholder roles:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to load stakeholder roles',
                type: 'error'
            });
        } finally {
            setLoadingStakeholders(false);
        }
    }

    const handleCreateStakeholderRole = async (roleData) => {
        try {
            const response = await postRequest('/api/event-system-config/stakeholder-role', roleData);
            
            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: 'Stakeholder role created successfully',
                    type: 'success'
                });
                
                // Refresh stakeholder roles for the selected domain
                if (selectedDomain) {
                    handleDomainSelect(selectedDomain);
                }
                
                // Refresh domains
                domainsData.refetch();
            } else {
                addNotification({
                    title: 'Error',
                    message: response.message || 'Failed to create stakeholder role',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error creating stakeholder role:', error);
            addNotification({
                title: 'Error',
                message: 'Failed to create stakeholder role',
                type: 'error'
            });
        }
    }

    
    useEffect(()=>{
        if(approvalGroupsData.data){
            console.log('Approval Groups:', approvalGroupsData.data);
        }
        if(approvalGroupsData.error){
            console.log('Approval Groups Error:', approvalGroupsData.error);
        }
    },[approvalGroupsData])

    useEffect(()=>{
        if(approvalFlowData.data){
            console.log('Approval Flow:', approvalFlowData.data);
        }
        if(approvalFlowData.error){
            console.log('Approval Flow Error:', approvalFlowData.error);
        }
    },[approvalFlowData])

    return (
        <div className="dash manage-flow">
            <Popup onClose={()=>setPopupOpen(false)} isOpen={popupOpen} defaultStyling={false}>
                {popupType === 'stakeholder' ? (
                    <NewStakeholderRole 
                        handleClose={() => setPopupOpen(false)} 
                        refetch={() => {
                            approvalFlowData.refetch();
                            domainsData.refetch();
                        }}
                    />
                ) : popupType === 'domain' ? (
                    <NewDomain 
                        handleClose={() => setPopupOpen(false)} 
                        refetch={() => {
                            approvalFlowData.refetch();
                            domainsData.refetch();
                        }}
                    />
                ) : (
                    <NewApproval 
                        handleClose={() => setPopupOpen(false)} 
                        refetch={approvalGroupsData.refetch}
                        refetchFlow={approvalFlowData.refetch}
                    />
                )}
            </Popup>
            
            <header className="header">
                <img src={BeaconMain} alt="" />
                <h1>Event Workflow Management</h1>
                <p>Manage approval workflows, stakeholder configurations, and event processing rules</p>

            </header>
            <div className="actions row">
                    <button className="create-btn" onClick={() => openPopup('stakeholder')}>
                        <Icon icon="fluent:person-add-24-filled"/>
                        Create Stakeholder Role
                    </button>
                    <button className="create-btn" onClick={() => openPopup('domain')}>
                        <Icon icon="ic:round-add-home"/>
                        Create Domain
                    </button>
                </div>
            <div className="content">
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'flows' ? 'active' : ''}`}
                        onClick={() => setActiveTab('flows')}
                    >
                        <Icon icon="mdi:workflow" />
                        Workflow Rules
                    </button>
                    <button 
                        className={`tab ${activeTab === 'stakeholders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stakeholders')}
                    >
                        <Icon icon="mdi:account-group" />
                        Stakeholders
                    </button>
                    <button 
                        className={`tab ${activeTab === 'domains' ? 'active' : ''}`}
                        onClick={() => setActiveTab('domains')}
                    >
                        <Icon icon="mdi:domain" />
                        Domains
                    </button>
                    <button 
                        className={`tab ${activeTab === 'management' ? 'active' : ''}`}
                        onClick={() => setActiveTab('management')}
                    >
                        <Icon icon="mdi:cog" />
                        Management
                    </button>
                    <button 
                        className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <Icon icon="mdi:chart-line" />
                        Analytics
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'flows' && (
                        <div className="flows-section">
                            <div className="section-header">
                                <h2>Workflow Rules</h2>
                                <div className="flow-stats">
                                    <div className="stat">
                                        <Icon icon="mdi:account-group" />
                                        <span>{approvalGroupsData.data?.data?.length || 0} Stakeholder Groups</span>
                                    </div>
                                    <div className="stat">
                                        <Icon icon="mdi:check-circle" />
                                        <span>{approvalFlowData.data?.data?.steps?.length || 0} Workflow Steps</span>
                                    </div>
                                    <div className="stat">
                                        <Icon icon="mdi:domain" />
                                        <span>{domainsData.data?.data?.length || 0} Domains</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flows-list">
                                {!approvalFlowData.loading && approvalFlowData.data?.data?.steps?.map((step, index) => {
                                    const approvalGroup = approvalGroupsData.data?.data?.find(group => group._id === step.orgId);
                                    return (
                                        <FlowCard
                                            key={step._id || index}
                                            step={step}
                                            group={approvalGroup}
                                            index={index}
                                            onDelete={() => handleGroupDelete(approvalGroup?._id)}
                                            onRefresh={() => {
                                                approvalGroupsData.refetch();
                                                approvalFlowData.refetch();
                                                domainsData.refetch();
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'domains' && (
                        <div className="domains-section">
                            <div className="section-header">
                                <h2>Domain Management</h2>
                                <div className="domain-actions">
                                    <button 
                                        className="bulk-action-btn primary"
                                        onClick={() => openPopup('domain')}
                                    >
                                        <Icon icon="ic:round-add-home" />
                                        Create Domain
                                    </button>
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:export" />
                                        Export Domains
                                    </button>
                                </div>
                            </div>

                            {domainsData.loading ? (
                                <div className="loading-section">
                                    <Icon icon="mdi:loading" className="spinning" />
                                    <span>Loading domains...</span>
                                </div>
                            ) : domainsData.data?.data?.length > 0 ? (
                                <div className="domains-grid">
                                    {domainsData.data.data.map((domain) => (
                                        <div key={domain._id} className="domain-management-card">
                                            <div className="domain-header">
                                                <div className="domain-info">
                                                    <h3>{domain.name}</h3>
                                                    <p className="domain-description">{domain.description || 'No description provided'}</p>
                                                    <div className="domain-meta">
                                                        <span className={`domain-type-badge ${domain.type}`}>
                                                            <Icon icon={`mdi:${domain.type === 'facility' ? 'building' : domain.type === 'department' ? 'office-building' : domain.type === 'organization' ? 'account-group' : 'cog'}`} />
                                                            {domain.type}
                                                        </span>
                                                        <span className="capacity-info">
                                                            <Icon icon="mdi:account-group" />
                                                            {domain.domainSettings?.maxCapacity ? `Max ${domain.domainSettings.maxCapacity} people` : 'No capacity limit'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="domain-status">
                                                    <div className={`status-indicator ${domain.isActive ? 'active' : 'inactive'}`}></div>
                                                    <span>{domain.isActive ? 'Active' : 'Inactive'}</span>
                                                </div>
                                            </div>

                                            <div className="domain-content">
                                                <div className="domain-stats">
                                                    <div className="stat">
                                                        <Icon icon="mdi:calendar" />
                                                        <span>0</span>
                                                        <label>Events</label>
                                                    </div>
                                                    <div className="stat">
                                                        <Icon icon="mdi:account-group" />
                                                        <span>0</span>
                                                        <label>Stakeholder Roles</label>
                                                    </div>
                                                    <div className="stat">
                                                        <Icon icon="mdi:shield-check" />
                                                        <span>{domain.domainSettings?.approvalWorkflow?.enabled ? 'Yes' : 'No'}</span>
                                                        <label>Approval Required</label>
                                                    </div>
                                                </div>

                                                <div className="domain-settings-preview">
                                                    <div className="setting-item">
                                                        <Icon icon="mdi:clock-outline" />
                                                        <span>Escalation: {domain.domainSettings?.approvalWorkflow?.escalationTimeout || 72}h</span>
                                                    </div>
                                                    <div className="setting-item">
                                                        <Icon icon="mdi:calendar-clock" />
                                                        <span>Max Advance: {domain.domainSettings?.bookingRules?.maxAdvanceBooking || 30} days</span>
                                                    </div>
                                                    <div className="setting-item">
                                                        <Icon icon="mdi:repeat" />
                                                        <span>Recurring: {domain.domainSettings?.bookingRules?.allowRecurring ? 'Yes' : 'No'}</span>
                                                    </div>
                                                </div>

                                                <div className="domain-actions">
                                                    <button 
                                                        className="domain-dashboard-btn"
                                                        onClick={() => navigate(`/domain-dashboard/${domain._id}`)}
                                                    >
                                                        <Icon icon="mdi:view-dashboard" />
                                                        Domain Dashboard
                                                    </button>
                                                    <button 
                                                        className="manage-domain-btn"
                                                        onClick={() => handleDomainSelect(domain._id)}
                                                    >
                                                        <Icon icon="mdi:account-group" />
                                                        Manage Stakeholders
                                                    </button>
                                                    <button className="edit-domain-btn">
                                                        <Icon icon="mdi:pencil" />
                                                        Edit Domain
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stakeholder Roles Section */}
                                            {selectedDomain === domain._id && (
                                                <div className="stakeholder-roles-section">
                                                    <div className="section-header">
                                                        <h4>Stakeholder Roles for {domain.name}</h4>
                                                        <button 
                                                            className="add-role-btn"
                                                            onClick={() => openPopup('stakeholder')}
                                                        >
                                                            <Icon icon="mdi:plus" />
                                                            Add Stakeholder Role
                                                        </button>
                                                    </div>
                                                    
                                                    {loadingStakeholders ? (
                                                        <div className="loading-stakeholders">
                                                            <Icon icon="mdi:loading" className="spinning" />
                                                            <span>Loading stakeholder roles...</span>
                                                        </div>
                                                    ) : stakeholderRoles.length === 0 ? (
                                                        <div className="no-stakeholder-roles">
                                                            <Icon icon="mdi:account-group" />
                                                            <h5>No Stakeholder Roles</h5>
                                                            <p>This domain doesn't have any stakeholder roles configured yet.</p>
                                                            <button 
                                                                className="create-role-btn"
                                                                onClick={() => openPopup('stakeholder')}
                                                            >
                                                                <Icon icon="mdi:plus" />
                                                                Create First Role
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="stakeholder-roles-list">
                                                            {stakeholderRoles.map((role) => (
                                                                <div key={role._id} className="stakeholder-role-card">
                                                                    <div className="role-info">
                                                                        <h5>{role.stakeholderName}</h5>
                                                                        <p className="role-description">{role.description || 'No description provided'}</p>
                                                                        <div className="role-meta">
                                                                            <span className={`role-type-badge ${role.stakeholderType}`}>
                                                                                <Icon icon={`mdi:${role.stakeholderType === 'approver' ? 'shield-check' : role.stakeholderType === 'acknowledger' ? 'check-circle' : 'bell'}`} />
                                                                                {role.stakeholderType}
                                                                            </span>
                                                                            <span className={`assignee-status ${role.currentAssignee?.userId ? 'assigned' : 'unassigned'}`}>
                                                                                <Icon icon={role.currentAssignee?.userId ? 'mdi:account-check' : 'mdi:account-off'} />
                                                                                {role.currentAssignee?.userId ? 'Assigned' : 'Unassigned'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="role-actions">
                                                                        <button className="edit-role-btn" title="Edit Role">
                                                                            <Icon icon="mdi:pencil" />
                                                                        </button>
                                                                        <button className="assign-role-btn" title="Assign User">
                                                                            <Icon icon="mdi:account-plus" />
                                                                        </button>
                                                                        <button className="delete-role-btn" title="Delete Role">
                                                                            <Icon icon="mdi:delete" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-domains">
                                    <div className="empty-state">
                                        <Icon icon="mdi:domain-off" />
                                        <h3>No Domains Configured</h3>
                                        <p>Create domains to manage facility-specific event settings, stakeholder roles, and approval workflows.</p>
                                        <button 
                                            className="create-domain-btn"
                                            onClick={() => openPopup('domain')}
                                        >
                                            <Icon icon="mdi:domain-plus" />
                                            Create Your First Domain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'management' && (
                        <div className="management-section">
                            <div className="section-header">
                                <h2>Workflow Management</h2>
                                <div className="management-actions">
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:reorder-horizontal" />
                                        Reorder Workflows
                                    </button>
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:export" />
                                        Export Configuration
                                    </button>
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:import" />
                                        Import Configuration
                                    </button>
                                </div>
                            </div>

                            <div className="management-grid">
                                <div className="management-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:workflow" />
                                        <h3>Workflow Order</h3>
                                    </div>
                                    <div className="card-content">
                                        <p>Drag and drop to reorder workflow steps</p>
                                        <div className="flow-order-list">
                                            {approvalFlowData.data?.data?.steps?.map((step, index) => {
                                                const group = approvalGroupsData.data?.data?.find(g => g._id === step.orgId);
                                                return (
                                                    <div key={step._id || index} className="order-item">
                                                        <div className="order-number">{index + 1}</div>
                                                        <div className="order-info">
                                                            <span className="group-name">{group?.org_name || step.role}</span>
                                                            <span className="step-role">{step.role}</span>
                                                        </div>
                                                        <div className="order-actions">
                                                            <button className="move-up-btn" disabled={index === 0}>
                                                                <Icon icon="mdi:chevron-up" />
                                                            </button>
                                                            <button className="move-down-btn" disabled={index === (approvalFlowData.data?.data?.steps?.length - 1)}>
                                                                <Icon icon="mdi:chevron-down" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="management-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:shield-check" />
                                        <h3>Workflow Status</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="status-controls">
                                            <div className="status-item">
                                                <label>Overall Workflow Status</label>
                                                <div className="status-toggle">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="toggle-label">Active</span>
                                                </div>
                                            </div>
                                            <div className="status-item">
                                                <label>Auto-Escalation</label>
                                                <div className="status-toggle">
                                                    <input type="checkbox" />
                                                    <span className="toggle-label">Enabled</span>
                                                </div>
                                            </div>
                                            <div className="status-item">
                                                <label>Notifications</label>
                                                <div className="status-toggle">
                                                    <input type="checkbox" defaultChecked />
                                                    <span className="toggle-label">Enabled</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="management-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:clock-outline" />
                                        <h3>Global Timeouts</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="timeout-settings">
                                            <div className="timeout-item">
                                                <label>Default Escalation (hours)</label>
                                                <input 
                                                    type="number" 
                                                    defaultValue={72} 
                                                    className="timeout-input"
                                                />
                                            </div>
                                            <div className="timeout-item">
                                                <label>Max Processing Time (days)</label>
                                                <input 
                                                    type="number" 
                                                    defaultValue={365} 
                                                    className="timeout-input"
                                                />
                                            </div>
                                            <div className="timeout-item">
                                                <label>Reminder Interval (hours)</label>
                                                <input 
                                                    type="number" 
                                                    defaultValue={24} 
                                                    className="timeout-input"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="management-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:backup-restore" />
                                        <h3>Backup & Restore</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="backup-actions">
                                            <button className="backup-btn">
                                                <Icon icon="mdi:download" />
                                                Download Backup
                                            </button>
                                            <button className="restore-btn">
                                                <Icon icon="mdi:upload" />
                                                Restore Backup
                                            </button>
                                        </div>
                                        <div className="backup-info">
                                            <p>Last backup: Never</p>
                                            <p>Backup size: 0 KB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stakeholders' && (
                        <div className="stakeholders-section">
                            <div className="section-header">
                                <h2>Stakeholder Role Management</h2>
                                <div className="stakeholder-actions">
                                    <button 
                                        className="bulk-action-btn primary"
                                        onClick={() => openPopup('stakeholder')}
                                    >
                                        <Icon icon="mdi:account-plus" />
                                        Create Stakeholder Role
                                    </button>
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:export" />
                                        Export Roles
                                    </button>
                                </div>
                            </div>

                            {domainsData.loading ? (
                                <div className="loading-section">
                                    <Icon icon="mdi:loading" className="spinning" />
                                    <span>Loading stakeholder roles...</span>
                                </div>
                            ) : domainsData.data?.data?.length > 0 ? (
                                <div className="stakeholders-overview">
                                    <div className="overview-stats">
                                        <div className="stat-card">
                                            <div className="stat-icon">
                                                <Icon icon="mdi:domain" />
                                            </div>
                                            <div className="stat-content">
                                                <h3>{domainsData.data.data.length}</h3>
                                                <p>Active Domains</p>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-icon">
                                                <Icon icon="mdi:account-group" />
                                            </div>
                                            <div className="stat-content">
                                                <h3>0</h3>
                                                <p>Total Stakeholder Roles</p>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-icon">
                                                <Icon icon="mdi:account-check" />
                                            </div>
                                            <div className="stat-content">
                                                <h3>0</h3>
                                                <p>Assigned Roles</p>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-icon">
                                                <Icon icon="mdi:shield-check" />
                                            </div>
                                            <div className="stat-content">
                                                <h3>0</h3>
                                                <p>Approver Roles</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="stakeholders-grid">
                                        {domainsData.data.data.map((domain) => (
                                            <div key={domain._id} className="domain-stakeholders-card">
                                                <div className="domain-header">
                                                    <div className="domain-info">
                                                        <h3>{domain.name}</h3>
                                                        <p className="domain-type">{domain.type}</p>
                                                        <div className="domain-meta">
                                                            <span className={`domain-type-badge ${domain.type}`}>
                                                                <Icon icon={`mdi:${domain.type === 'facility' ? 'building' : domain.type === 'department' ? 'office-building' : domain.type === 'organization' ? 'account-group' : 'cog'}`} />
                                                                {domain.type}
                                                            </span>
                                                            <span className="stakeholder-count">
                                                                <Icon icon="mdi:account-group" />
                                                                0 stakeholder roles
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="domain-status">
                                                        <div className={`status-indicator ${domain.isActive ? 'active' : 'inactive'}`}></div>
                                                        <span>{domain.isActive ? 'Active' : 'Inactive'}</span>
                                                    </div>
                                                </div>

                                                <div className="stakeholder-roles-list">
                                                    <div className="no-stakeholder-roles">
                                                        <div className="empty-state">
                                                            <Icon icon="mdi:account-group" />
                                                            <h5>No Stakeholder Roles</h5>
                                                            <p>This domain doesn't have any stakeholder roles configured yet.</p>
                                                            <button 
                                                                className="add-role-btn"
                                                                onClick={() => openPopup('stakeholder')}
                                                            >
                                                                <Icon icon="mdi:plus" />
                                                                Add Stakeholder Role
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-domains">
                                    <div className="empty-state">
                                        <Icon icon="mdi:domain-off" />
                                        <h3>No Domains Available</h3>
                                        <p>Create domains first to manage stakeholder roles for different facilities and departments.</p>
                                        <button 
                                            className="create-domain-btn"
                                            onClick={() => openPopup('domain')}
                                        >
                                            <Icon icon="mdi:domain-plus" />
                                            Create Your First Domain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <h2>System Settings</h2>
                                <div className="settings-actions">
                                    <button className="save-settings-btn">
                                        <Icon icon="mdi:content-save" />
                                        Save All Settings
                                    </button>
                                    <button className="reset-settings-btn">
                                        <Icon icon="mdi:refresh" />
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>

                            <div className="settings-grid">
                                <div className="settings-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:bell" />
                                        <h3>Notifications</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="setting-group">
                                            <div className="setting-item">
                                                <label>Email Notifications</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" defaultChecked />
                                                    <span>Send email notifications</span>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>In-App Notifications</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" defaultChecked />
                                                    <span>Show in-app notifications</span>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>SMS Notifications</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" />
                                                    <span>Send SMS notifications</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:security" />
                                        <h3>Security</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="setting-group">
                                            <div className="setting-item">
                                                <label>Require 2FA</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" />
                                                    <span>Require two-factor authentication</span>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>Session Timeout</label>
                                                <div className="setting-control">
                                                    <select>
                                                        <option value="30">30 minutes</option>
                                                        <option value="60" selected>1 hour</option>
                                                        <option value="120">2 hours</option>
                                                        <option value="480">8 hours</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>Audit Logging</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" defaultChecked />
                                                    <span>Enable audit logging</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:database" />
                                        <h3>Data Management</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="setting-group">
                                            <div className="setting-item">
                                                <label>Auto-Backup</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" defaultChecked />
                                                    <span>Enable automatic backups</span>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>Backup Frequency</label>
                                                <div className="setting-control">
                                                    <select>
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly" selected>Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>Data Retention</label>
                                                <div className="setting-control">
                                                    <select>
                                                        <option value="30">30 days</option>
                                                        <option value="90" selected>90 days</option>
                                                        <option value="365">1 year</option>
                                                        <option value="forever">Forever</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-card">
                                    <div className="card-header">
                                        <Icon icon="mdi:api" />
                                        <h3>API & Integrations</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="setting-group">
                                            <div className="setting-item">
                                                <label>API Access</label>
                                                <div className="setting-control">
                                                    <input type="checkbox" defaultChecked />
                                                    <span>Enable API access</span>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>Rate Limiting</label>
                                                <div className="setting-control">
                                                    <input type="number" defaultValue={100} />
                                                    <span>requests per minute</span>
                                                </div>
                                            </div>
                                            <div className="setting-item">
                                                <label>Webhook URL</label>
                                                <div className="setting-control">
                                                    <input type="url" placeholder="https://example.com/webhook" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <FlowAnalytics 
                            approvalGroups={approvalGroupsData.data?.data || []}
                            approvalFlow={approvalFlowData.data?.data}
                        />
                    )}

                </div>
            </div>
        </div>
    )
}

export default ManageFlow;
import React, { useEffect, useState } from 'react';
import './ManageFlow.scss';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import {useFetch} from '../../../hooks/useFetch';
import { useNotification } from '../../../NotificationContext';
import Popup from '../../../components/Popup/Popup';
import NewApproval from './NewApproval/NewApproval';
import FlowCard from './FlowCard/FlowCard';
import FlowAnalytics from './FlowAnalytics/FlowAnalytics';

function ManageFlow(){
    const approvalGroupsData = useFetch('/approval-groups');
    const approvalFlowData = useFetch('/get-approval-flow');
    const [popupOpen, setPopupOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('flows');
    const { addNotification } = useNotification();

    const openPopup = () => {
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
        } catch (error) {
            addNotification({
                title: 'Error',
                message: 'Failed to delete approval group',
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
                <NewApproval refetch={approvalGroupsData.refetch} refetchFlow={approvalFlowData.refetch}/>
            </Popup>
            
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>Approval Flows</h1>
                <p>Manage your approval workflows and groups</p>

            </header>
            <div className="actions">
                    <button className="create-btn" onClick={openPopup}>
                        <Icon icon="fluent:add-12-filled"/>
                        Create Approval Group
                    </button>
                </div>
            <div className="content">
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'flows' ? 'active' : ''}`}
                        onClick={() => setActiveTab('flows')}
                    >
                        <Icon icon="mdi:workflow" />
                        Flows
                    </button>
                    <button 
                        className={`tab ${activeTab === 'management' ? 'active' : ''}`}
                        onClick={() => setActiveTab('management')}
                    >
                        <Icon icon="mdi:cog" />
                        Management
                    </button>
                    <button 
                        className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
                        onClick={() => setActiveTab('groups')}
                    >
                        <Icon icon="mdi:account-group" />
                        Groups
                    </button>
                    <button 
                        className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Icon icon="mdi:settings" />
                        Settings
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
                                <h2>Approval Flows</h2>
                                <div className="flow-stats">
                                    <div className="stat">
                                        <Icon icon="mdi:account-group" />
                                        <span>{approvalGroupsData.data?.data?.length || 0} Groups</span>
                                    </div>
                                    <div className="stat">
                                        <Icon icon="mdi:check-circle" />
                                        <span>{approvalFlowData.data?.data?.steps?.length || 0} Steps</span>
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
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'management' && (
                        <div className="management-section">
                            <div className="section-header">
                                <h2>Flow Management</h2>
                                <div className="management-actions">
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:reorder-horizontal" />
                                        Reorder Flows
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
                                        <h3>Flow Order</h3>
                                    </div>
                                    <div className="card-content">
                                        <p>Drag and drop to reorder approval steps</p>
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
                                        <h3>Flow Status</h3>
                                    </div>
                                    <div className="card-content">
                                        <div className="status-controls">
                                            <div className="status-item">
                                                <label>Overall Flow Status</label>
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
                                                <input type="number" defaultValue={72} className="timeout-input" />
                                            </div>
                                            <div className="timeout-item">
                                                <label>Max Processing Time (days)</label>
                                                <input type="number" defaultValue={7} className="timeout-input" />
                                            </div>
                                            <div className="timeout-item">
                                                <label>Reminder Interval (hours)</label>
                                                <input type="number" defaultValue={24} className="timeout-input" />
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

                    {activeTab === 'groups' && (
                        <div className="groups-section">
                            <div className="section-header">
                                <h2>Group Management</h2>
                                <div className="group-actions">
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:account-multiple-plus" />
                                        Bulk Add Members
                                    </button>
                                    <button className="bulk-action-btn">
                                        <Icon icon="mdi:export" />
                                        Export Members
                                    </button>
                                </div>
                            </div>

                            <div className="groups-grid">
                                {approvalGroupsData.data?.data?.map((group) => {
                                    const step = approvalFlowData.data?.data?.steps?.find(s => s.orgId === group._id);
                                    return (
                                        <div key={group._id} className="group-management-card">
                                            <div className="group-header">
                                                <div className="group-info">
                                                    <h3>{group.org_name}</h3>
                                                    <p>{group.org_description}</p>
                                                    <div className="group-meta">
                                                        <span className="step-position">Step {step ? approvalFlowData.data?.data?.steps?.indexOf(step) + 1 : 'N/A'}</span>
                                                        <span className="member-count">{group.members?.length || 0} members</span>
                                                    </div>
                                                </div>
                                                <div className="group-status">
                                                    <div className="status-indicator active"></div>
                                                    <span>Active</span>
                                                </div>
                                            </div>

                                            <div className="group-content">
                                                <div className="group-stats">
                                                    <div className="stat">
                                                        <Icon icon="mdi:account-group" />
                                                        <span>{group.members?.length || 0}</span>
                                                        <label>Members</label>
                                                    </div>
                                                    <div className="stat">
                                                        <Icon icon="mdi:clock-outline" />
                                                        <span>0</span>
                                                        <label>Pending</label>
                                                    </div>
                                                    <div className="stat">
                                                        <Icon icon="mdi:check-circle" />
                                                        <span>0</span>
                                                        <label>Approved</label>
                                                    </div>
                                                </div>

                                                <div className="group-actions">
                                                    <button className="manage-members-btn">
                                                        <Icon icon="mdi:account-group" />
                                                        Manage Members
                                                    </button>
                                                    <button className="edit-group-btn">
                                                        <Icon icon="mdi:pencil" />
                                                        Edit Group
                                                    </button>
                                                    <button className="group-settings-btn">
                                                        <Icon icon="mdi:cog" />
                                                        Settings
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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
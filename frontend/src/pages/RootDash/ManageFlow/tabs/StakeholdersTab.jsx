import React from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function StakeholdersTab({ 
    domainsData, 
    openPopup 
}) {
    console.log(domainsData);
    return (
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
    );
}

export default StakeholdersTab;



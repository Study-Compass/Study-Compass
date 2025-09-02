import React, { useEffect, useState } from 'react';
import { useFetch } from '../../../../hooks/useFetch';
import { Icon } from '@iconify-icon/react';
import './OrgOverview.scss';

function OrgOverview() {
    const { data: analytics, loading, error } = useFetch('/org-management/analytics?timeRange=30d');
    const { data: config } = useFetch('/org-management/config');
    const [timeRange, setTimeRange] = useState('30d');

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#ff9800';
            case 'approved': return '#4caf50';
            case 'rejected': return '#f44336';
            default: return '#757575';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#f44336';
            case 'high': return '#ff9800';
            case 'medium': return '#2196f3';
            case 'low': return '#4caf50';
            default: return '#757575';
        }
    };

    if (loading) {
        return (
            <div className="org-overview">
                <div className="loading">Loading overview...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="org-overview">
                <div className="error">Error loading overview: {error}</div>
            </div>
        );
    }

    const data = analytics?.data;

    return (
        <div className="org-overview">
            <header className="header">
                <h1>Organization Management Overview</h1>
                <p>Monitor and manage student organizations</p>
            </header>

            <div className="content">
                {/* Quick Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Icon icon="mdi:account-group" />
                        </div>
                        <div className="stat-content">
                            <h3>{data?.overview?.totalOrgs || 0}</h3>
                            <p>Total Organizations</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon verified">
                            <Icon icon="mdi:shield-check" />
                        </div>
                        <div className="stat-content">
                            <h3>{data?.overview?.verifiedOrgs || 0}</h3>
                            <p>Verified Organizations</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon members">
                            <Icon icon="mdi:account-multiple" />
                        </div>
                        <div className="stat-content">
                            <h3>{data?.overview?.totalMembers || 0}</h3>
                            <p>Total Members</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon events">
                            <Icon icon="mdi:calendar" />
                        </div>
                        <div className="stat-content">
                            <h3>{data?.overview?.totalEvents || 0}</h3>
                            <p>Events This Month</p>
                        </div>
                    </div>
                </div>

                {/* Verification Requests Summary */}
                <div className="section">
                    <h2>Verification Requests</h2>
                    <div className="requests-summary">
                        {data?.verificationRequests && Object.entries(data.verificationRequests).map(([status, count]) => (
                            <div key={status} className="request-status" style={{ borderColor: getStatusColor(status) }}>
                                <div className="status-indicator" style={{ backgroundColor: getStatusColor(status) }}></div>
                                <div className="status-content">
                                    <h4>{count}</h4>
                                    <p>{status.charAt(0).toUpperCase() + status.slice(1)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Organizations */}
                <div className="section">
                    <h2>Top Organizations by Members</h2>
                    <div className="top-orgs">
                        {data?.topOrganizations?.slice(0, 5).map((org, index) => (
                            <div key={org._id} className="org-item">
                                <div className="org-rank">#{index + 1}</div>
                                <div className="org-info">
                                    <h4>{org.orgName}</h4>
                                    <p>{org.memberCount} members</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="section">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions">
                        <button className="action-btn primary">
                            <Icon icon="mdi:shield-check" />
                            <span>Review Pending Requests</span>
                        </button>
                        <button className="action-btn secondary">
                            <Icon icon="mdi:account-plus" />
                            <span>Add New Organization</span>
                        </button>
                        <button className="action-btn secondary">
                            <Icon icon="mdi:download" />
                            <span>Export Data</span>
                        </button>
                        <button className="action-btn secondary">
                            <Icon icon="mdi:cog" />
                            <span>Manage Settings</span>
                        </button>
                    </div>
                </div>

                {/* System Status */}
                <div className="section">
                    <h2>System Status</h2>
                    <div className="system-status">
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <span>Verification System</span>
                            <span className="status-text">Online</span>
                        </div>
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <span>Auto-Approval</span>
                            <span className="status-text">
                                {config?.data?.autoApproveNewOrgs ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="status-item">
                            <div className="status-indicator online"></div>
                            <span>Notifications</span>
                            <span className="status-text">Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrgOverview;

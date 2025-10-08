import React from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function AnalyticsTab() {
    return (
        <div className="analytics-section">
            <div className="section-header">
                <h2>Analytics & Reporting</h2>
                <div className="analytics-actions">
                    <button className="bulk-action-btn">
                        <Icon icon="mdi:export" />
                        Export Report
                    </button>
                    <button className="bulk-action-btn">
                        <Icon icon="mdi:calendar" />
                        Schedule Report
                    </button>
                </div>
            </div>

            <div className="analytics-content">
                <div className="coming-soon">
                    <div className="empty-state">
                        <Icon icon="mdi:chart-line" />
                        <h3>Analytics Coming Soon</h3>
                        <p>Advanced analytics and reporting features are currently under development.</p>
                        <div className="feature-preview">
                            <h4>Planned Features:</h4>
                            <ul>
                                <li>Workflow performance metrics</li>
                                <li>Approval time analytics</li>
                                <li>Stakeholder activity reports</li>
                                <li>Domain utilization statistics</li>
                                <li>Custom dashboard creation</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsTab;



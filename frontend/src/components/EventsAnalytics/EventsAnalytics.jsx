import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { useFetch } from '../../hooks/useFetch';
import './EventsAnalytics.scss';

function EventsAnalytics() {
    const [timeRange, setTimeRange] = useState('30d');
    const { data: analytics, loading, error, refetch } = useFetch(`/event-analytics/overview?timeRange=${timeRange}`);

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    const getTimeRangeLabel = (range) => {
        const labels = {
            '7d': 'Last 7 Days',
            '30d': 'Last 30 Days',
            '90d': 'Last 90 Days'
        };
        return labels[range] || range;
    };

    const handleTimeRangeChange = (newRange) => {
        setTimeRange(newRange);
    };

    if (loading) {
        return (
            <div className="events-analytics">
                <div className="loading">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="events-analytics">
                <div className="error">Error loading analytics: {error}</div>
            </div>
        );
    }

    const data = analytics?.data;

    return (
        <div className="events-analytics">
            <div className="analytics-header">
                <h1>Events Analytics</h1>
                <div className="time-range-selector">
                    <button 
                        className={timeRange === '7d' ? 'active' : ''} 
                        onClick={() => handleTimeRangeChange('7d')}
                    >
                        7 Days
                    </button>
                    <button 
                        className={timeRange === '30d' ? 'active' : ''} 
                        onClick={() => handleTimeRangeChange('30d')}
                    >
                        30 Days
                    </button>
                    <button 
                        className={timeRange === '90d' ? 'active' : ''} 
                        onClick={() => handleTimeRangeChange('90d')}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            <div className="analytics-overview">
                <div className="metric-card">
                    <div className="metric-icon">
                        <Icon icon="mingcute:calendar-fill" />
                    </div>
                    <div className="metric-content">
                        <h3>Total Events</h3>
                        <p className="metric-value">{formatNumber(data?.totalEvents || 0)}</p>
                        <p className="metric-label">{getTimeRangeLabel(timeRange)}</p>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <Icon icon="mingcute:eye-fill" />
                    </div>
                    <div className="metric-content">
                        <h3>Total Views</h3>
                        <p className="metric-value">{formatNumber(data?.totalViews || 0)}</p>
                        <p className="metric-label">{formatNumber(data?.totalUniqueViews || 0)} unique logged-in</p>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <Icon icon="mingcute:user-fill" />
                    </div>
                    <div className="metric-content">
                        <h3>Anonymous Views</h3>
                        <p className="metric-value">{formatNumber(data?.totalAnonymousViews || 0)}</p>
                        <p className="metric-label">{formatNumber(data?.totalUniqueAnonymousViews || 0)} unique anonymous</p>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <Icon icon="mingcute:user-add-fill" />
                    </div>
                    <div className="metric-content">
                        <h3>Total RSVPs</h3>
                        <p className="metric-value">{formatNumber(data?.totalRsvps || 0)}</p>
                        <p className="metric-label">{formatNumber(data?.totalUniqueRsvps || 0)} unique</p>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">
                        <Icon icon="mingcute:trending-up-fill" />
                    </div>
                    <div className="metric-content">
                        <h3>Engagement Rate</h3>
                        <p className="metric-value">{data?.engagementRate || 0}%</p>
                        <p className="metric-label">RSVPs per view</p>
                    </div>
                </div>
            </div>

            <div className="top-events-section">
                <h2>Top Events by Views</h2>
                <div className="top-events-list">
                    {data?.topEventsByViews?.length > 0 ? (
                        data.topEventsByViews.map((event, index) => (
                            <div key={index} className="event-item">
                                <div className="event-rank">#{index + 1}</div>
                                <div className="event-info">
                                    <h4>{event.eventName}</h4>
                                    <div className="event-stats">
                                        <span className="stat">
                                            <Icon icon="mingcute:eye-fill" />
                                            {formatNumber(event.views)} views
                                        </span>
                                        <span className="stat">
                                            <Icon icon="mingcute:user-add-fill" />
                                            {formatNumber(event.rsvps)} RSVPs
                                        </span>
                                        <span className="stat">
                                            <Icon icon="mingcute:trending-up-fill" />
                                            {event.views > 0 ? ((event.rsvps / event.views) * 100).toFixed(1) : 0}% engagement
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">No events data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EventsAnalytics;

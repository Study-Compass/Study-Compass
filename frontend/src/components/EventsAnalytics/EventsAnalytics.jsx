import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { useFetch } from '../../hooks/useFetch';
import MetricCard from '../MetricCard';
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
                <MetricCard
                    icon="mingcute:calendar-fill"
                    title="Total Events"
                    value={data?.totalEvents || 0}
                    label={getTimeRangeLabel(timeRange)}
                    color="var(--dark-blue)"
                    size="small"
                />

                <MetricCard
                    icon="mingcute:eye-fill"
                    title="Total Views"
                    value={data?.totalViews || 0}
                    label={`${formatNumber(data?.totalUniqueViews || 0)} unique logged-in`}
                    color="var(--dark-blue)"
                    size="small"
                />

                <MetricCard
                    icon="mdi:anonymous"
                    title="Anonymous Views"
                    value={data?.totalAnonymousViews || 0}
                    label={`${formatNumber(data?.totalUniqueAnonymousViews || 0)} unique anonymous`}
                    color="var(--dark-blue)"
                    size="small"
                />

                <MetricCard
                    icon="mingcute:user-add-fill"
                    title="Total RSVPs"
                    value={data?.totalRsvps || 0}
                    label={`${formatNumber(data?.totalUniqueRsvps || 0)} unique`}
                    color="var(--dark-blue)"
                    size="small"
                />

                <MetricCard
                    icon="mingcute:trending-up-fill"
                    title="Engagement Rate"
                    value={`${data?.engagementRate || 0}%`}
                    label="RSVPs per view"
                    color="var(--dark-blue)"
                    size="small"
                />
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

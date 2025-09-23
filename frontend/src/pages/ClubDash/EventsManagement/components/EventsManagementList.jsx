import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify-icon/react';
import { useFetch } from '../../../../hooks/useFetch';
import { useNotification } from '../../../../NotificationContext';
import apiRequest from '../../../../utils/postRequest';
import './EventsManagementList.scss';

function EventsList({ orgId, orgName, refreshTrigger, onRefresh, onEventSelection, selectedEvents, onViewEvent }) {
    const { addNotification } = useNotification();
    const [filters, setFilters] = useState({
        status: 'all',
        type: 'all',
        timeRange: 'all',
        search: ''
    });
    const [sortBy, setSortBy] = useState('start_time');
    const [sortOrder, setSortOrder] = useState('asc');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    
    // Fetch events data
    const { data: eventsData, loading, error, refetch } = useFetch(
        orgId ? `/org-event-management/${orgId}/events?${new URLSearchParams({
            page: page.toString(),
            limit: '20',
            ...filters,
            sortBy,
            sortOrder
        })}` : null
    );

    // Refetch when refreshTrigger changes
    useEffect(() => {
        if (refreshTrigger > 0) {
            refetch();
        }
    }, [refreshTrigger, refetch]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filters, sortBy, sortOrder]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'approved': '#28a745',
            'pending': '#ffc107',
            'rejected': '#dc3545',
            'not-applicable': '#6c757d'
        };
        return colors[status] || '#6c757d';
    };

    const getTypeColor = (type) => {
        const colors = {
            'meeting': '#6D8EFA',
            'campus': '#6D8EFA',
            'study': '#6EB25F',
            'sports': '#6EB25F',
            'alumni': '#5C5C5C',
            'arts': '#FBEBBB'
        };
        return colors[type] || '#6c757d';
    };

    const handleEventSelect = (eventId) => {
        const newSelection = selectedEvents.includes(eventId)
            ? selectedEvents.filter(id => id !== eventId)
            : [...selectedEvents, eventId];
        onEventSelection(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedEvents.length === eventsData?.data?.events?.length) {
            onEventSelection([]);
        } else {
            const allEventIds = eventsData?.data?.events?.map(event => event._id) || [];
            onEventSelection(allEventIds);
        }
    };

    const handleViewEvent = (event) => {
        if (onViewEvent) {
            onViewEvent(event);
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedEvents.length === 0) {
            addNotification({
                title: 'No Events Selected',
                message: 'Please select events to perform bulk actions',
                type: 'warning'
            });
            return;
        }

        try {
            const response = await apiRequest(
                `/org-event-management/${orgId}/events/bulk-action`,
                {
                    action,
                    eventIds: selectedEvents
                },
                { method: 'POST' }
            );

            if (response.success) {
                addNotification({
                    title: 'Success',
                    message: response.message,
                    type: 'success'
                });
                onEventSelection([]);
                onRefresh();
            } else {
                throw new Error(response.message || 'Action failed');
            }
        } catch (error) {
            addNotification({
                title: 'Error',
                message: error.message || 'Failed to perform bulk action',
                type: 'error'
            });
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    if (loading && page === 1) {
        return (
            <div className="events-list loading">
                <div className="loading-spinner">
                    <Icon icon="mdi:loading" className="spinner" />
                    <p>Loading events...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="events-list error">
                <Icon icon="mdi:alert-circle" />
                <p>Error loading events: {error}</p>
            </div>
        );
    }

    const events = eventsData?.data?.events || [];
    const pagination = eventsData?.data?.pagination || {};
    const summary = eventsData?.data?.summary || {};

    return (
        <div className="events-management-list">
            <div className="events-header">
                <div className="header-content">
                    <h2>Events Management</h2>
                    <p>Manage and organize your organization's events</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="filter-btn"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Icon icon="mdi:filter" />
                        <span>Filters</span>
                    </button>
                    <button className="create-btn">
                        <Icon icon="mingcute:add-fill" />
                        <span>Create Event</span>
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="summary-stats">
                <div className="stat-item">
                    <span className="stat-label">Total Events:</span>
                    <span className="stat-value">{summary.totalEvents || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Expected Attendance:</span>
                    <span className="stat-value">{summary.totalExpectedAttendance || 0}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Avg Attendance:</span>
                    <span className="stat-value">{summary.avgExpectedAttendance || 0}</span>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Status</label>
                            <select 
                                value={filters.status} 
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                                <option value="not-applicable">Not Applicable</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Type</label>
                            <select 
                                value={filters.type} 
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="meeting">Meeting</option>
                                <option value="campus">Campus</option>
                                <option value="study">Study</option>
                                <option value="sports">Sports</option>
                                <option value="alumni">Alumni</option>
                                <option value="arts">Arts</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Time Range</label>
                            <select 
                                value={filters.timeRange} 
                                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                            >
                                <option value="all">All Time</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="past">Past</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                            </select>
                        </div>
                    </div>
                    <div className="filter-row">
                        <div className="filter-group search">
                            <label>Search</label>
                            <input 
                                type="text"
                                placeholder="Search events..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selectedEvents.length > 0 && (
                <div className="bulk-actions">
                    <div className="bulk-info">
                        <span>{selectedEvents.length} events selected</span>
                    </div>
                    <div className="bulk-buttons">
                        <button 
                            className="bulk-btn approve"
                            onClick={() => handleBulkAction('approve')}
                        >
                            <Icon icon="mdi:check" />
                            <span>Approve</span>
                        </button>
                        <button 
                            className="bulk-btn reject"
                            onClick={() => handleBulkAction('reject')}
                        >
                            <Icon icon="mdi:close" />
                            <span>Reject</span>
                        </button>
                        <button 
                            className="bulk-btn delete"
                            onClick={() => handleBulkAction('delete')}
                        >
                            <Icon icon="mdi:delete" />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Events Table */}
            <div className="events-table">
                <div className="table-header">
                    <div className="header-cell checkbox">
                        <input 
                            type="checkbox"
                            checked={selectedEvents.length === events.length && events.length > 0}
                            onChange={handleSelectAll}
                        />
                    </div>
                    <div className="header-cell sortable" onClick={() => handleSort('name')}>
                        Event Name
                        {sortBy === 'name' && (
                            <Icon icon={sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'} />
                        )}
                    </div>
                    <div className="header-cell sortable" onClick={() => handleSort('type')}>
                        Type
                        {sortBy === 'type' && (
                            <Icon icon={sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'} />
                        )}
                    </div>
                    <div className="header-cell sortable" onClick={() => handleSort('start_time')}>
                        Date & Time
                        {sortBy === 'start_time' && (
                            <Icon icon={sortOrder === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'} />
                        )}
                    </div>
                    <div className="header-cell">Location</div>
                    <div className="header-cell">Status</div>
                    <div className="header-cell">Attendance</div>
                    <div className="header-cell">Actions</div>
                </div>

                <div className="table-body">
                    {events.map((event) => (
                        <div key={event._id} className="table-row">
                            <div className="table-cell checkbox">
                                <input 
                                    type="checkbox"
                                    checked={selectedEvents.includes(event._id)}
                                    onChange={() => handleEventSelect(event._id)}
                                />
                            </div>
                            <div className="table-cell event-name">
                                <div className="event-info">
                                    <h4>{event.name}</h4>
                                    {event.description && (
                                        <p className="event-description">
                                            {event.description.length > 100 
                                                ? `${event.description.substring(0, 100)}...` 
                                                : event.description
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="table-cell event-type">
                                <span 
                                    className="type-badge"
                                    style={{ backgroundColor: getTypeColor(event.type) }}
                                >
                                    {event.type}
                                </span>
                            </div>
                            <div className="table-cell event-date">
                                <div className="date-info">
                                    <p className="date">{formatDate(event.start_time)}</p>
                                    <p className="time">
                                        {new Date(event.start_time).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })} - {new Date(event.end_time).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="table-cell event-location">
                                <Icon icon="fluent:location-28-filled" />
                                <span>{event.location}</span>
                            </div>
                            <div className="table-cell event-status">
                                <span 
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(event.status) }}
                                >
                                    {event.status}
                                </span>
                            </div>
                            <div className="table-cell event-attendance">
                                <span className="attendance-value">{event.expectedAttendance}</span>
                            </div>
                            <div className="table-cell event-actions">
                                <button 
                                    className="action-btn view" 
                                    title="View Event"
                                    onClick={() => handleViewEvent(event)}
                                >
                                    <Icon icon="mdi:eye" />
                                </button>
                                <button className="action-btn edit" title="Edit Event">
                                    <Icon icon="mdi:pencil" />
                                </button>
                                <button className="action-btn analytics" title="View Analytics">
                                    <Icon icon="mingcute:chart-fill" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button 
                        className="page-btn"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        <Icon icon="mdi:chevron-left" />
                        Previous
                    </button>
                    
                    <div className="page-numbers">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    className={`page-number ${page === pageNum ? 'active' : ''}`}
                                    onClick={() => setPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        className="page-btn"
                        disabled={page === pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                        <Icon icon="mdi:chevron-right" />
                    </button>
                </div>
            )}

            {/* Empty State */}
            {events.length === 0 && !loading && (
                <div className="empty-state">
                    <Icon icon="mingcute:calendar-fill" />
                    <h3>No Events Found</h3>
                    <p>No events match your current filters. Try adjusting your search criteria.</p>
                    <button className="create-btn">
                        <Icon icon="mingcute:add-fill" />
                        <span>Create Your First Event</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default EventsList;

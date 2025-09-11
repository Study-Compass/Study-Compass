import React, { useEffect } from 'react';
import './Review.scss';
import { Icon } from '@iconify-icon/react';

const Review = ({ formData, setFormData, onComplete, allStepsValid }) => {
    
    // Format date and time for display
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Not set';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDuration = () => {
        if (!formData.startTime || !formData.endTime) return '';
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        const durationMs = end - start;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours === 0) return `${minutes} minutes`;
        if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`;
    };

    // Call onComplete once on mount - validation is handled by FlowComponentV2
    useEffect(() => {
        onComplete(true);
    }, []);

    return (
        <div className="review-step">
            <div className="form-section">
                <h3>Review Your Study Session</h3>
                <p>Please review all the details before creating your study session.</p>

                <div className="review-sections">
                    {/* Basic Information */}
                    <div className="review-section">
                        <div className="section-header">
                            <Icon icon="mingcute:book-6-fill" />
                            <h4>Basic Information</h4>
                        </div>
                        <div className="review-items">
                            <div className="review-item">
                                <span className="label">Title:</span>
                                <span className="value">{formData.title}</span>
                            </div>
                            <div className="review-item">
                                <span className="label">Course/Subject:</span>
                                <span className="value">{formData.course}</span>
                            </div>
                            {formData.description && (
                                <div className="review-item">
                                    <span className="label">Description:</span>
                                    <span className="value description">{formData.description}</span>
                                </div>
                            )}
                            <div className="review-item">
                                <span className="label">Visibility:</span>
                                <span className="value visibility">
                                    <span className={`visibility-badge ${formData.visibility}`}>
                                        {formData.visibility === 'public' ? 'Public - Anyone can join' : 'Private - Invite only'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Time & Location */}
                    <div className="review-section">
                        <div className="section-header">
                            <Icon icon="mingcute:time-fill" />
                            <h4>Time & Location</h4>
                        </div>
                        <div className="review-items">
                            <div className="review-item">
                                <span className="label">Start Time:</span>
                                <span className="value">{formatDateTime(formData.startTime)}</span>
                            </div>
                            <div className="review-item">
                                <span className="label">End Time:</span>
                                <span className="value">{formatDateTime(formData.endTime)}</span>
                            </div>
                            <div className="review-item">
                                <span className="label">Duration:</span>
                                <span className="value">{formatDuration()}</span>
                            </div>
                            <div className="review-item">
                                <span className="label">Location:</span>
                                <span className="value">{formData.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Invited Users */}
                    {formData.invitedUsers && formData.invitedUsers.length > 0 && (
                        <div className="review-section">
                            <div className="section-header">
                                <Icon icon="mingcute:group-fill" />
                                <h4>Invited Users</h4>
                            </div>
                            <div className="review-items">
                                <div className="review-item">
                                    <span className="label">Invited Friends:</span>
                                    <div className="value invited-users">
                                        {formData.invitedUsers.map((user) => (
                                            <div key={user._id} className="invited-user">
                                                <div className="user-avatar">
                                                    {user.picture ? (
                                                        <img 
                                                            src={user.picture} 
                                                            alt={user.name}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="avatar-fallback" style={{ display: user.picture ? 'none' : 'flex' }}>
                                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                </div>
                                                <span>{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Review;

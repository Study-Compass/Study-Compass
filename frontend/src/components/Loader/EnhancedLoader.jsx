import React from 'react';
import { Icon } from '@iconify-icon/react';
import './EnhancedLoader.scss';

const EnhancedLoader = ({ 
    type = 'default', 
    message = 'Loading...', 
    size = 'medium',
    showSpinner = true 
}) => {
    const getLoaderContent = () => {
        switch (type) {
            case 'events':
                return (
                    <div className={`enhanced-loader events-loader ${size}`}>
                        <div className="loader-content">
                            {showSpinner && (
                                <div className="spinner-container">
                                    <div className="spinner"></div>
                                </div>
                            )}
                            <div className="message-container">
                                <p className="message">{message}</p>
                                <div className="loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            
            case 'compact':
                return (
                    <div className={`enhanced-loader compact-loader ${size}`}>
                        <div className="compact-spinner"></div>
                        <span className="compact-message">{message}</span>
                    </div>
                );
            
            case 'pulse':
                return (
                    <div className={`enhanced-loader pulse-loader ${size}`}>
                        <div className="pulse-container">
                            <div className="pulse-dot"></div>
                            <div className="pulse-dot"></div>
                            <div className="pulse-dot"></div>
                        </div>
                        <p className="pulse-message">{message}</p>
                    </div>
                );
            
            default:
                return (
                    <div className={`enhanced-loader default-loader ${size}`}>
                        <div className="loader-content">
                            {showSpinner && (
                                <div className="spinner-container">
                                    <div className="spinner"></div>
                                </div>
                            )}
                            <p className="message">{message}</p>
                        </div>
                    </div>
                );
        }
    };

    return getLoaderContent();
};

export default EnhancedLoader;

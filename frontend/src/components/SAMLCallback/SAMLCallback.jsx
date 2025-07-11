import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './SAMLCallback.scss';

const SAMLCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { validateToken } = useAuth();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleSAMLCallback = async () => {
            try {
                setStatus('processing');
                
                // Check if we have SAML response parameters
                const urlParams = new URLSearchParams(location.search);
                const samlResponse = urlParams.get('SAMLResponse');
                const relayState = urlParams.get('RelayState');
                
                if (!samlResponse) {
                    throw new Error('No SAML response received');
                }

                // The SAML response should have been processed by the backend
                // and cookies should be set. Let's validate the token.
                await validateToken();
                
                setStatus('success');
                
                // Redirect to the intended destination or default
                const redirectTo = relayState || '/room/none';
                setTimeout(() => {
                    navigate(redirectTo, { replace: true });
                }, 1000);
                
            } catch (error) {
                console.error('SAML callback error:', error);
                setError(error.message || 'SAML authentication failed');
                setStatus('error');
                
                // Redirect to login after error
                setTimeout(() => {
                    navigate('/login', { 
                        replace: true,
                        state: { error: 'SAML authentication failed. Please try again.' }
                    });
                }, 3000);
            }
        };

        handleSAMLCallback();
    }, [location, navigate, validateToken]);

    if (status === 'processing') {
        return (
            <div className="saml-callback">
                <div className="callback-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                    <h2>Completing Authentication</h2>
                    <p>Please wait while we complete your login...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="saml-callback">
                <div className="callback-container">
                    <div className="success-icon">✓</div>
                    <h2>Authentication Successful</h2>
                    <p>Redirecting you to Study Compass...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="saml-callback">
                <div className="callback-container">
                    <div className="error-icon">✗</div>
                    <h2>Authentication Failed</h2>
                    <p>{error || 'An error occurred during authentication.'}</p>
                    <p>Redirecting to login page...</p>
                </div>
            </div>
        );
    }

    return null;
};

export default SAMLCallback; 
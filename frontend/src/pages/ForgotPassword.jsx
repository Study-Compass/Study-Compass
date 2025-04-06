import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header/Header';
import logo from '../assets/red_logo.svg';
import { useNotification } from '../NotificationContext';
import './Login.scss';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isCodeVerified, setIsCodeVerified] = useState(false);
    const [error, setError] = useState('');
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await axios.post('/forgot-password', { email });
            
            if (response.data.success) {
                setIsCodeSent(true);
                addNotification({ 
                    title: 'Code Sent', 
                    message: 'Password reset code has been sent to your email.',
                    type: 'success' 
                });
            }
        } catch (error) {
            console.error('Error requesting password reset code:', error);
            setError(error.response?.data?.message || 'An error occurred. Please try again.');
            addNotification({ 
                title: 'Error', 
                message: error.response?.data?.message || 'An error occurred. Please try again.',
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await axios.post('/verify-code', { 
                email, 
                code: verificationCode
            });
            
            if (response.data.success) {
                setIsCodeVerified(true);
                addNotification({ 
                    title: 'Code Verified', 
                    message: 'Verification code is valid. Please set your new password.',
                    type: 'success' 
                });
                
                // Redirect to reset password page with email and code as query params
                navigate(`/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(verificationCode)}`);
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            setError(error.response?.data?.message || 'An error occurred. Please try again.');
            addNotification({ 
                title: 'Error', 
                message: error.response?.data?.message || 'An error occurred. Please try again.',
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="main-login">
            <div className="block"></div>

            <div className="login-container">
                <img src={logo} alt="Study Compass Logo" className="logo" />
                
                {!isCodeSent ? (
                    <>
                        <h2 className="form-title">Forgot Password</h2>
                        <p className="form-subtitle">
                            Enter your email address and we'll send you a verification code to reset your password.
                        </p>
                        
                        <form onSubmit={handleRequestCode} className="forgot-password-form">
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                            
                            {error && <div className="error-message">{error}</div>}
                            
                            <button 
                                type="submit" 
                                className="submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="form-title">Enter Verification Code</h2>
                        <p className="form-subtitle">
                            We've sent a verification code to <strong>{email}</strong>. Please enter it below.
                        </p>
                        
                        <form onSubmit={handleVerifyCode} className="verify-code-form">
                            <div className="form-group">
                                <label htmlFor="verificationCode">Verification Code</label>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    required
                                    placeholder="Enter 6-digit code"
                                    maxLength={6}
                                    className="verification-code"
                                />
                            </div>
                            
                            {error && <div className="error-message">{error}</div>}
                            
                            <button 
                                type="submit" 
                                className="submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </form>
                    </>
                )}
                
                <div className="form-footer">
                    <Link to="/login" className="back-to-login">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword; 
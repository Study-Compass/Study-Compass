import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationContext';
import apiRequest from './utils/postRequest';

/** 
documentation:
https://incongruous-reply-44a.notion.site/Frontend-AuthProvider-Component-AuthContext-951d04c042614f32a9052e9d57905e8d
*/

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(true); // [1
    const [user, setUser] = useState(null);
    const [checkedIn, setCheckedIn] = useState(null);
    const [authMethod, setAuthMethod] = useState(null); // 'google', 'saml', 'email'

    const { addNotification } = useNotification();

    const validateToken = async () => {
        try {
            // Make the GET request to the validate-token endpoint with cookies
            const response = await apiRequest('/validate-token', null, { method: 'GET' });
            console.log('Token validation response:', response);
            // console.log('Token validation response:', response.data);
            // Handle response...
            if (response.success) {
                setUser(response.data.user);
                // Determine auth method from user data
                if (response.data.user.samlProvider) {
                    setAuthMethod('saml');
                } else if (response.data.user.googleId) {
                    setAuthMethod('google');
                } else {
                    setAuthMethod('email');
                }
                // console.log(response.data.user);
                setIsAuthenticated(true);
                setIsAuthenticating(false);
                getCheckedIn();
            } else {
                setIsAuthenticated(false);
                setIsAuthenticating(false);
            }
        } catch (error) {
            console.log('Token expired or invalid');
            setIsAuthenticated(false);
            setIsAuthenticating(false);
            return error;
        }
    };

    useEffect(() => {
        validateToken();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axios.post('/login', credentials, {
                withCredentials: true
            });
            if (response.status === 200) {
                setIsAuthenticated(true);
                setUser(response.data.data.user);
                setAuthMethod('email');
                console.log(response.data);
                addNotification({ title:'Logged in successfully',type: 'success'});
            }
        } catch (error) {
            // console.error('Login failed:', error);
            // Handle login error
            throw error;
        }
    };

    const googleLogin = async (code, isRegister) => {
        try {
            const url = window.location.href;
            const response = await axios.post('/google-login', { code, isRegister, url }, {
                withCredentials: true
            });
            // Handle response from the backend (e.g., storing the token, redirecting the user)
            console.log('Backend response:', response.data);
            console.log('User object from Google login:', response.data.data.user);
            setIsAuthenticated(true);
            setUser(response.data.data.user);
            setAuthMethod('google');
            // addNotification({title: 'Logged in successfully',type: 'success'});
            // For example, redirect the user or store the received token in local storage
        } catch (error) {
            console.error('Error sending code to backend:', error);
            // Handle error
            throw error;
        }
    };

    const samlLogin = async (relayState = null) => {
        try {
            // Redirect to SAML login endpoint
            const baseUrl = window.location.origin;
            const loginUrl = `${baseUrl}/auth/saml/login${relayState ? `?relayState=${encodeURIComponent(relayState)}` : ''}`;
            window.location.href = loginUrl;
        } catch (error) {
            console.error('SAML login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Use SAML logout if user authenticated via SAML
            if (authMethod === 'saml') {
                await axios.post('/auth/saml/logout', {}, { withCredentials: true });
            } else {
                await axios.post('/logout', {}, { withCredentials: true });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsAuthenticated(false);
            setUser(null);
            setAuthMethod(null);
            addNotification({title: 'Logged out successfully',type: 'success'});
        }
    };

    const getDeveloper = async () => {
        try {
            const response = await axios.get('/get-developer', {
                withCredentials: true
            });
            
            if (response.data.success) {
                const responseBody = response.data;
                console.log('Developer:', responseBody);
                return responseBody;
            } else {
                return { developer: null};
            }
        }
        catch (error) {
            console.error('Error fetching developer:', error);
        }
    }

    const getCheckedIn = async () => {
        try {
            const response = await axios.get('/checked-in', {
                withCredentials: true
            });

            if (response.data.success) {
                const responseBody = response.data;
                if(responseBody.classrooms.length === 0){
                    return { checkedIn: null };
                }
                console.log(responseBody.classrooms[0]);
                setCheckedIn(responseBody.classrooms[0]);
            } else {
                return { checkedIn: null };
            }
        } catch (error) {
            console.error('Error fetching checked in:', error);
        }
    }

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            user, 
            login, 
            logout, 
            googleLogin, 
            samlLogin,
            validateToken, 
            isAuthenticating, 
            getDeveloper, 
            checkedIn, 
            getCheckedIn,
            authMethod 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

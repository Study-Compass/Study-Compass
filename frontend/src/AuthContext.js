import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from './NotificationContext';
import { set } from 'mongoose';

/** 
documentation:
https://incongruous-reply-44a.notion.site/Frontend-AuthProvider-Component-AuthContext-951d04c042614f32a9052e9d57905e8d
*/

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(true); // [1
    const [user, setUser] = useState(null);

    const { addNotification } = useNotification();

    const validateToken = async () => {
        const token = localStorage.getItem('token');
        try {
            // Set up the Authorization header
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            // Make the GET request to the validate-token endpoint
            const response = await axios.get('/validate-token', config);

            console.log('Token validation response:', response.data);
            // Handle response...
            if (response.data.success) {
                setUser(response.data.data.user);
                console.log(response.data.data.user);
                setIsAuthenticated(true);
                setIsAuthenticating(false);
            } else {
                setIsAuthenticated(false);
                setIsAuthenticating(false);
                localStorage.removeItem('token');
            }
        } catch (error) {
            localStorage.removeItem('token');
            console.log('Token expired or invalid');
            setIsAuthenticated(false);
            setIsAuthenticating(false);
            return error;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            validateToken();
        } else {
            setIsAuthenticated(false);
            setIsAuthenticating(false);
        }
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axios.post('/login', credentials);
            if (response.status === 200) {
                localStorage.setItem('token', response.data.data.token);
                setIsAuthenticated(true);
                setUser(response.data.data.user);
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
            const response = await axios.post('/google-login', { code, isRegister });
            // Handle response from the backend (e.g., storing the token, redirecting the user)
            console.log('Backend response:', response.data);
            localStorage.setItem('token', response.data.data.token);
            setIsAuthenticated(true);
            setUser(response.data.data.user);
            // addNotification({title: 'Logged in successfully',type: 'success'});
            // For example, redirect the user or store the received token in local storage
        } catch (error) {
            console.error('Error sending code to backend:', error);
            // Handle error
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        addNotification({title: 'Logged out successfully',success: 'success'});
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, googleLogin, validateToken, isAuthenticating }}>
            {children}
        </AuthContext.Provider>
    );
};

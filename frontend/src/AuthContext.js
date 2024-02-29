import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);


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
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            localStorage.removeItem('token');
            console.log('Token expired or invalid');
            return error;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            validateToken();
        } else {
            setIsAuthenticated(false);
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
            }
        } catch (error) {
            console.error('Login failed:', error);
            // Handle login error
            throw error;
        }
    };

    const googleLogin = async (code) => {
        try {
          const response = await axios.post('/google-login', { code });
          // Handle response from the backend (e.g., storing the token, redirecting the user)
          console.log('Backend response:', response.data);
          localStorage.setItem('token', response.data.data.token);
        setIsAuthenticated(true);
        setUser(response.data.data.user);
          // For example, redirect the user or store the received token in local storage
        } catch (error) {
          console.error('Error sending code to backend:', error);
        }
      };
    
    // const googleL2ogin = (token) => {
    //     localStorage.setItem('token', token);
    //     setIsAuthenticated(true);
    // };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, googleLogin }}>
            {children}
        </AuthContext.Provider>
    );
};

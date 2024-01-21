import { useState, useEffect } from 'react';
import axios from 'axios';

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Optionally: Verify token validity with the backend
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (credentials) => {
        try {
            const response = await axios.post('/login', credentials);
            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                setIsAuthenticated(true);
                // Optionally set user details
                setUser(response.data.user);
            }
        } catch (error) {
            console.error('Login failed:', error);
            // Handle login error
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
    };

    return { isAuthenticated, user, login, logout };
};

export default useAuth;

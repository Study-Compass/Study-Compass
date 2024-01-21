import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Optionally: Verify token validity with the backend
            setIsAuthenticated(true);
        }
    }, []);

    // useEffect(() => {
    //     if (isAuthenticated) {
    //         navigate('room/none');
    //     }
    // }, [isAuthenticated, navigate]);

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
        navigate('/')
    };

    return { isAuthenticated, user, login, logout };
};

export default useAuth;

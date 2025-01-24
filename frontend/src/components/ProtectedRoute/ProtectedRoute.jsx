import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useNotification } from '../../NotificationContext';

const ProtectedRoute = ({ authorizedRoles }) => {
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const { addNotification } = useNotification();

    // Function to check if the user has the required roles
    const isAuthorized = () => {
        if (authorizedRoles) {
            return authorizedRoles.some((role) => user?.roles?.includes(role));
        }
        return true;
    };

    // While authentication status is loading, we can show a spinner or placeholder
    if (isAuthenticating) {
        return null; // Replace with your loading spinner/component
    }

    // Redirect unauthenticated users
    if (!isAuthenticated) {
        addNotification({
            title: 'Unauthenticated',
            message: 'You must be logged in to view this page',
            type: 'error',
        });
        return <Navigate to="/" replace />;
    }

    // Redirect unauthorized users
    if (!isAuthorized()) {
        addNotification({
            title: 'Unauthorized',
            message: 'You do not have permission to view this page',
            type: 'error',
        });
        return <Navigate to="/unauthorized" replace />;
    }

    // If authenticated and authorized, render the nested route(s)
    return <Outlet />;
};

export default ProtectedRoute;

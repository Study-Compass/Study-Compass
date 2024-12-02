import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './NewBadge.scss';
import { useNotification } from '../../NotificationContext';

const NewBadge = () => {
    const { user, isAuthenticating, isAuthenticated } = useAuth();
    const location = useLocation();
    const {reloadNotification} = useNotification();

    if(isAuthenticating){  
        return <div>Loading...</div>
    }
    
    if (!user) {
        reloadNotification({title: "Please login to access this page", message: "You will be redirected to the login page", type: "error"});
        setTimeout(() => {
            window.location.reload();
        }, 100);
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    
    
    return (
        <div>
        <h1>NewBadge</h1>
        </div>
    );
};

export default NewBadge;
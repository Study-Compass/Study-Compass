import React, { useEffect, useState } from 'react';
import './RootManagement.scss';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';
import useAuth from '../../../hooks/useAuth';


function RootManagement(){
    const {user} = useAuth();

    return (
        <div className="dash root-management">
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>Root User Management</h1>
                <p>Good Afternoon, {user.name}</p>
            </header>
            
        </div>
    )
}

export default RootManagement;
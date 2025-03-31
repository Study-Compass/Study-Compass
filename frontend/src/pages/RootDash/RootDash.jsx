import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Dashboard from '../../components/Dashboard/Dashboard';
import RootManagement from './RootManagement/RootManagement';
import ManageFlow from './ManageFlow/ManageFlow';

function RootDash(){
    const menuItems = [
        { label: 'Dashboard', icon: 'ic:round-dashboard' },
        { label: 'Manage Flow', icon: 'fluent:flow-16-filled' }
    ];

    return (
        <Dashboard menuItems={menuItems} additionalClass='root-dash'>
            <RootManagement/>
            <ManageFlow/>
        </Dashboard>
    )
}

export default RootDash;
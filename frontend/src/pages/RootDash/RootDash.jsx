import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Dashboard from '../../components/Dashboard/Dashboard';
import RootManagement from './RootManagement/RootManagement';
import ManageFlow from './ManageFlow/ManageFlow';
import RSSManagement from './RSSManagement/RSSManagement';
// import BadgeManager from './BadgeManager/BadgeManager';

function RootDash(){
    const menuItems = [
        { label: 'Dashboard', icon: 'ic:round-dashboard' },
        { label: 'Manage Flow', icon: 'fluent:flow-16-filled' },
        { label: 'RSS Management', icon: 'mdi:rss' },
    ];

    return (
        <Dashboard menuItems={menuItems} additionalClass='root-dash'>
            <RootManagement/>
            <ManageFlow/>
            <RSSManagement/>
        </Dashboard>
    )
}

export default RootDash;
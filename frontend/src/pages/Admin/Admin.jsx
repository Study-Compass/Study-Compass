import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BlueGrad1 from '../../assets/BlueGrad1.png';
import BlueGrad2 from '../../assets/BlueGrad2.png';

import Analytics from '../../components/Analytics/Analytics';
import Dashboard from '../../components/Dashboard/Dashboard';
import BadgeManager from './BadgeManager/BadgeManager';
import ManageUsers from './ManageUsers/ManageUsers';

import './Admin.scss';

function Admin(){
    const { user } = useAuth();

    const [showPage, setShowPage] = useState("analytics");

    const toggleAnalytics = (page) => {
        if(showPage === page){
            setShowPage("");
            return;
        }
        setShowPage(page);
    }

    if(!user){
        return(
            <div className="admin">
                <Header />
            </div>
        );
    }

    const menuItems = [
        { label: 'General', icon: 'ic:round-dashboard' },
        { label: 'Analytics', icon: 'bx:stats' },
        { label: 'Manage Users', icon: 'ic:round-dashboard'},
        { label: 'Badge Grants', icon: 'bx:stats'}
    ]

    return(
        <Dashboard menuItems={menuItems} additionalClass='admin'>
            <div></div>
            <Analytics/>
            <ManageUsers/>
            <BadgeManager/>
        </Dashboard>
    );
}

export default Admin
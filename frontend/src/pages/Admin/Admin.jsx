import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BlueGrad1 from '../../assets/BlueGrad1.png';
import BlueGrad2 from '../../assets/BlueGrad2.png';

import Analytics from '../../components/Analytics/Analytics';
import Dashboard from '../../components/Dashboard/Dashboard';
import General from './General/General'
import BadgeManager from './BadgeManager/BadgeManager';
import ManageUsers from './ManageUsers/ManageUsers';

import eventsLogo from '../../assets/Brand Image/EventsLogo.svg';


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
        { 
            label: 'General', 
            icon: 'ic:round-dashboard',
            element: <General/>
        },
        { 
            label: 'Analytics', 
            icon: 'bx:stats',
            element: <Analytics/>
        },
        { 
            label: 'Manage Users', 
            icon: 'ic:round-dashboard',
            element: <ManageUsers/>
        },
        { 
            label: 'Badge Grants', 
            icon: 'bx:stats',
            element: <BadgeManager/>
        }
    ]

    return(
        <Dashboard menuItems={menuItems} additionalClass='admin' logo={eventsLogo}>
        </Dashboard>
    );
}

export default Admin
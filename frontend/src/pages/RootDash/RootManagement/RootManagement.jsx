import React, { useEffect, useState } from 'react';
import './RootManagement.scss';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';
import useAuth from '../../../hooks/useAuth';
import HeaderContainer from '../../../components/HeaderContainer/HeaderContainer';
import SiteHealth from '../../Admin/General/SiteHealth/SiteHealth';
import SimpleAnalyticsChart from '../../../components/Analytics/VisitsChart/SimpleAnalyticsChart';

function RootManagement(){
    const {user} = useAuth();

    return (
        <div className="dash root-management">
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>Root User Management</h1>
                <p>Good Afternoon, {user.name}</p>
            </header>
            <div className="general-content">
                <SiteHealth />
                <HeaderContainer header='weekly analytics' icon="mage:chart-up-fill">
                    <div className="analytics-container">
                        <SimpleAnalyticsChart endpoint='visits' heading='Visits' color='#7CCF6A' />
                        <SimpleAnalyticsChart endpoint='users' heading='Users' color='#7CCF6A' />
                        <SimpleAnalyticsChart endpoint='searches' heading='Searches' color='#7CCF6A' />

                    </div>
                </HeaderContainer>
            </div>
        </div>
    )
}

export default RootManagement;
import React from 'react';
import './Beacon.scss';
import Dashboard from '../../../components/Dashboard/Dashboard';
import Home from './Home/Home';
import BeaconLogo from '../../../assets/Brand Image/SolutionLogos/Beacon.svg';
import { useNavigate } from 'react-router-dom';
import ManageFlow from '../../RootDash/ManageFlow/ManageFlow';
import RSSManagement from '../../RootDash/RSSManagement/RSSManagement';
import EventSystemConfig from './EventSystemConfig/EventSystemConfig';

const Beacon = () => {
    const navigate = useNavigate();
    const menuItems = [
        {
            label: 'Home',
            icon: 'material-symbols:home-outline',
            element: <Home />
        },
        {
            label: 'System Configuration',
            icon: 'mdi:cog',
            element: <EventSystemConfig />
        },
        {
            label: 'Manage Flow',
            icon: 'fluent:flow-16-filled',
            element: <ManageFlow />
        },
        {
            label: 'RSS Management',
            icon: 'mdi:rss',
            element: <RSSManagement />
        }
    ];
    return (
        <Dashboard menuItems={menuItems} additionalClass='root-dash' logo={BeaconLogo} onBack={()=>navigate('/root-dashboard')}>
        </Dashboard>
    );
};

export default Beacon;
import React from 'react';
import './Beacon.scss';
import Dashboard from '../../../components/Dashboard/Dashboard';
import Home from './Home/Home';
import BeaconLogo from '../../../assets/Brand Image/SolutionLogos/Beacon.svg';
import { useNavigate } from 'react-router-dom';

const Beacon = () => {
    const navigate = useNavigate();
    const menuItems = [
        {
            label: 'Home',
            icon: 'material-symbols:home-outline',
            element: <Home />
        }
    ];
    return (
        <Dashboard menuItems={menuItems} additionalClass='root-dash' logo={BeaconLogo} onBack={()=>navigate('/root-dashboard')}>
        </Dashboard>
    );
};

export default Beacon;
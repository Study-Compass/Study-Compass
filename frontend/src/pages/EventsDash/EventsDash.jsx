import React, {useState, useEffect} from 'react';
import './EventsDash.scss';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Dashboard from '../../components/Dashboard/Dashboard';
import Explore from './Explore/Explore';

function EventsDash({  }){
    const menuItems = [
        { label: 'Explore', icon: 'mingcute:compass-fill' },
    ];

    return (
        <Dashboard menuItems={menuItems} additionalClass='events-dash'>
            <Explore />
            <div></div>
        </Dashboard>
    )
}

export default EventsDash;
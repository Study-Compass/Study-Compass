import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Configuration from './Configuration/Configuration';
import EventsCalendar from './EventsCalendar/EventsCalendar';
import Dashboard from '../../components/Dashboard/Dashboard';

import Dash from './Dash/Dash';
import ManageEvents from './ManageEvents/ManageEvents';


function OIEDash(){

    const menuItems = [
        { label: 'Dashboard', icon: 'ic:round-dashboard' },
        { label: 'Event Calendar', icon: 'heroicons:calendar-16-solid' },
        { label: 'Events Board', icon: 'heroicons-solid:view-boards' },
        { label: 'Configuration', icon: 'flowbite:adjustments-horizontal-solid' }
    ];

    return (
        <Dashboard menuItems={menuItems} additionalClass='oie-dash'>
            <Dash />
            <EventsCalendar />
            <ManageEvents />
            <Configuration />
        </Dashboard>
    )
}

export default OIEDash;
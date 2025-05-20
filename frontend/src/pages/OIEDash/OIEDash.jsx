import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import ApprovalConfig from './ApprovalConfig/ApprovalConfig';
import EventsCalendar from './EventsCalendar/EventsCalendar';
import Dashboard from '../../components/Dashboard/Dashboard';

import Dash from './Dash/Dash';
import ManageEvents from './ManageEvents/ManageEvents';
import Approval from '../RootDash/ManageFlow/Approval/Approval';


function OIEDash(){
    const [approvalId, setApprovalId] = useState(useParams().id);

    const menuItems = [
        { label: 'Dashboard', icon: 'ic:round-dashboard' },
        { label: 'Event Calendar', icon: 'heroicons:calendar-16-solid' },
        { label: 'Events Board', icon: 'heroicons-solid:view-boards' },
        { label: 'Configuration', icon: 'flowbite:adjustments-horizontal-solid' }
    ];

    return (
        <Dashboard menuItems={menuItems} additionalClass='oie-dash'>
            <Dash name={approvalId} />
            <EventsCalendar />
            <ManageEvents />
            <ApprovalConfig approvalId={approvalId} />
        </Dashboard>
    )
}

export default OIEDash;
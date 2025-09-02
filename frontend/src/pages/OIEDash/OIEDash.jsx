import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import ApprovalConfig from './ApprovalConfig/ApprovalConfig';
import EventsCalendar from './EventsCalendar/EventsCalendar';
import Dashboard from '../../components/Dashboard/Dashboard';

import Dash from './Dash/Dash';
import ManageEvents from './ManageEvents/ManageEvents';
import Approval from '../RootDash/ManageFlow/Approval/Approval';
import eventsLogo from '../../assets/Brand Image/EventsLogo.svg';


function OIEDash(){
    const [approvalId, setApprovalId] = useState(useParams().id);

    const menuItems = [
        { 
            label: 'Dashboard', 
            icon: 'ic:round-dashboard',
            element: <Dash name={approvalId} />
        },
        { 
            label: 'Event Calendar', 
            icon: 'heroicons:calendar-16-solid',
            element: <EventsCalendar />
        },
        { 
            label: 'Events Board', 
            icon: 'heroicons-solid:view-boards',
            element: <ManageEvents />
        },
        { 
            label: 'Configuration', 
            icon: 'flowbite:adjustments-horizontal-solid',
            element: <ApprovalConfig approvalId={approvalId} />
        }
    ];

    return (
        <Dashboard menuItems={menuItems} additionalClass='oie-dash' logo={eventsLogo}>
        </Dashboard>
    )
}

export default OIEDash;
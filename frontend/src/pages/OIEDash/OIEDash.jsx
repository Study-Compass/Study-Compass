import React, { useEffect, useState } from 'react';
import './OIEDash.scss';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useSearchParams, useHistory  } from 'react-router-dom';
import logo from '../../assets/Brand Image/EventsLogo.svg';
import { getAllEvents } from '../../components/EventsViewer/EventHelpers';
import Configuration from './Configuration/Configuration';
import EventsCalendar from './EventsCalendar/EventsCalendar';
import defaultAvatar from '../../assets/defaultAvatar.svg';

import {Icon} from '@iconify-icon/react';  
import Dash from './Dash/Dash';
import ManageEvents from './ManageEvents/ManageEvents';


function OIEDash(){
    const [searchParams, setSearchParams] = useSearchParams();
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const {isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState({});

    const [currentPage, setCurrentPage] = useState(0);
    const [currentDisplay, setCurrentDisplay] = useState(0);

    useEffect(()=>{
        const pageFromUrl = searchParams.get("page");
        if(pageFromUrl){
            setCurrentDisplay(parseInt(pageFromUrl));
        }
    },[]);

    const onExpand = () => {
        if(expanded){
            setExpandedClass("minimized");
            setTimeout(() => {
                setExpanded(false);
            }, 200);
        } else {
            setExpanded(true);
            setTimeout(() => {
                setExpandedClass("maximized");
            }, 200);

        }
    }

    useEffect(() => {
            setCurrentPage(currentPage);
            setSearchParams({ page: currentDisplay }, { replace: true });
        }, [currentDisplay]);

    return (
        <div className="oie-dash">
            <div className={`dash-left ${expanded && "hidden"}`}>
                <div className="top">
                    <div className="logo">
                        <img src={logo} alt="" />
                    </div>
                    <nav className="nav">
                        <ul>
                            <li className={` ${currentDisplay === 0 && "selected"}`} onClick={()=>setCurrentDisplay(0)}>
                                <Icon icon="ic:round-dashboard" />
                                <p>Dashboard</p>
                            </li>
                            <li className={` ${currentDisplay === 1 && "selected"}`}  onClick={()=>setCurrentDisplay(1)}>
                                <Icon icon="heroicons:calendar-16-solid" />
                                <p>Event Calendar</p>
                            </li>
                            <li className={` ${currentDisplay === 2 && "selected"}`}  onClick={()=>setCurrentDisplay(2)}>
                                <Icon icon="heroicons-solid:view-boards" />
                                <p>Events Board</p>
                            </li>
                            <li className={` ${currentDisplay === 3 && "selected"}`}  onClick={()=>setCurrentDisplay(3)}>
                                <Icon icon="flowbite:adjustments-horizontal-solid" />
                                <p>Configuration</p>
                            </li>
                            <li onClick={()=>navigate('/create-event')}>
                                <Icon icon="ph:plus-bold" className="create-icon"/>
                                <p>Create Event</p>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className="bottom">
                    <div className="user">
                        <div className="avatar">
                            <img src={user.image ? user.image : defaultAvatar} alt="" />
                        </div>
                        <div className="user-info">
                            <p className="username">{user.name}</p>
                            <p className="email">{user.email}</p>
                        </div>
                    </div>
                    <div className="back" onClick={()=>navigate('/room/none')}>
                        <Icon icon="ep:back"/>
                        <p>back to study compass</p>
                    </div>
                </div>
            </div>
            <div className={`dash-right ${expandedClass}`}>
                    {
                        (currentPage === 0 || currentDisplay === 0) &&
                        <div className={`${currentDisplay === 0 && "visible"} dash-content`}>
                            <Dash expandedClass={expandedClass} change={setCurrentDisplay}/>
                        </div>
                    }
                    {
                        (currentPage === 1 || currentDisplay === 1) &&
                        <div className={`${currentDisplay === 1 && "visible"} dash-content`}>
                            <EventsCalendar expandedClass={expandedClass}/>
                        </div>
                    }
                    {
                        (currentPage === 2 || currentDisplay === 2) &&
                        <div className={`${currentDisplay === 2 && "visible"} dash-content`}>
                            <ManageEvents expandedClass={expandedClass}/>
                        </div>
                    }
                    {
                        (currentPage === 3 || currentDisplay === 3) &&
                        <div className={`${currentDisplay === 3 && "visible"} dash-content`}>
                            <Configuration />
                        </div>
                    }
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    )
}

export default OIEDash;
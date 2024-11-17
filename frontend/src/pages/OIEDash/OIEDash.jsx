import React, { useEffect, useState } from 'react';
import './OIEDash.scss';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../assets/Icons/Dashboard.svg';
import logo from '../../assets/red_logo.svg';
import { getAllEvents } from '../../components/EventsViewer/EventHelpers';

import {Icon} from '@iconify-icon/react';  
import Dash from './Dash/Dash';

function OIEDash(){
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const {isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState({});

    useEffect(()=>{
        if(isAuthenticating){
            return;
        }
        if(!isAuthenticated){
            navigate('/');
        }
        if(!user){
            return;
        } else {
            if(!user.admin){
                navigate('/');
            }
            setUserInfo(user);
        }
        
    },[isAuthenticating, isAuthenticated, user]);

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

    return (
        <div className="oie-dash">
            <div className={`dash-left ${expanded && "hidden"}`}>
                <div className="logo">
                    <img src={logo} alt="" />
                    <div className="oie-badge"><p>OIE admin</p></div>
                </div>
                <nav className="nav">
                    <ul>
                        <li className='selected'>
                            <img src={Dashboard} alt="" />
                            <p>Dashboard</p>
                        </li>
                        <li className=''>
                            <div className="icon-container">
                                <Icon icon="heroicons:calendar-16-solid" />
                            </div>
                            <p>Event Calendar</p>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className={`dash-right ${expandedClass}`}>
                <div className="dash-content">
                    <Dash expandedClass={expandedClass}/>
                    <div className={`expand`} onClick={onExpand}>
                        <Icon icon="material-symbols:expand-content-rounded" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OIEDash;
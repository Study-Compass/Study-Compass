import React, { useEffect, useState} from 'react';
import './ClubDash.scss';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../assets/Icons/Dashboard.svg';
import logo from '../../assets/red_logo.svg';
import { getAllEvents } from '../../components/EventsViewer/EventHelpers';

import {Icon} from '@iconify-icon/react';  
import Dash from './Dash/Dash';
import Members from './Members/Members';
import { set } from 'mongoose';

function ClubDash(){
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const{isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [members, setMembers] = useState(false);
    const [dash, setDash] = useState(true);
    
    function toggleMembers(){
        if (!members){
            setMembers(true);
            setDash(false);
        }

    }

    function toggleDash(){
        if (!dash){
            setDash(true);
            setMembers(false);
        }
    }


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
        <div className="club-dash">
            <div className={`dash-left ${expanded && "hidden"}`}>
                <div className="logo">
                    <img src={logo} alt="" />
                    <div className="club-badge"><p>club admin</p></div>
                </div>
                <nav className="nav">
                    <ul>
                        <li className= {`${dash ? 'selected' : ''}`} onClick={toggleDash}>
                            <img src={Dashboard} alt="" />
                            <p>Dashboard</p>
                        </li>
                        <li className={`${members ? 'selected' : ''}`}  onClick = {toggleMembers}>
                            <img src={Dashboard} alt="" />
                            <p>Members</p>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className={`dash-right ${expandedClass}`}>
                {    
                    members ? <Members expandedClass = {expandedClass}/> :  dash ? <Dash expandedClass={expandedClass}/> : ''
                }
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    )
}


export default ClubDash;
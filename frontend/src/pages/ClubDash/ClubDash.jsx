import React, { useEffect, useState} from 'react';
import './ClubDash.scss';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../assets/Icons/Dashboard.svg';
import logo from '../../assets/red_logo.svg';
import { getAllEvents } from '../../components/EventsViewer/EventHelpers';
import EventMeeting from './ClubEventsComponents/EventMeeting/EventMeeting';
import {Icon} from '@iconify-icon/react';  
import Dash from './Dash/Dash';
import Members from './Members/Members';
import { set } from 'mongoose';

function ClubDash(){
    const [expanded, setExpanded] = useState(false);
    const [expands, setExpands] = useState(false);
    const [expandedClass, setExpandedClass] = useState("minimized");
    const{isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState(null);

    const [currentPage, setCurrentPage] = useState('dash');
    
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

    const onExpand = (expand) => {
        if(expand){
            setExpandedClass("minimized");
            setTimeout(() => {
                setExpanded(false);
            }, 200);
        } else{
            setExpanded(true);
            setTimeout(() => {
                setExpandedClass("maximized");
            }, 200);

        }
    }

    const openMeeting = () => {
        // onExpand();
        onExpand(false);
        setCurrentPage(null);
        setTimeout(() => {    
            setCurrentPage("meeting");
        }, 700);
    }

    const openDash = () => {
        onExpand(true);
        setTimeout(() => {    
            setCurrentPage("dash");
            // onExpand();
        }, 200);
    }

    const Expand = () => {
        if(expanded){
            setExpandedClass("minimized");
            setTimeout(() => {
                setExpanded(false);
            }, 200);
        } else{
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
                        <li className= {`${currentPage === 'dash' ? 'selected' : ''}`} onClick={()=>setCurrentPage("dash")}>
                            <img src={Dashboard} alt="" />
                            <p>Dashboard</p>
                        </li>
                        <li className={`${currentPage === "members" ? 'selected' : ''}`}  onClick = {()=>setCurrentPage('members')}>
                            <img src={Dashboard} alt="" />
                            <p>Members</p>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className={`dash-right ${expandedClass}`}>
                {
                    currentPage === "dash" &&
                    <Dash expandedClass={expandedClass} openMeeting={openMeeting}/> 
                }
                {
                    currentPage === 'members' && 
                    <Members expandedClass = {expandedClass}/>
                }
                {
                    currentPage === 'meeting' && 
                    <EventMeeting expandedClass = {expandedClass} openDash={openDash}/>
                }

                <div className={`expand` }  onClick={Expand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    )
}


export default ClubDash;
import React, { useEffect, useState} from 'react';
import './ClubDash.scss';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import Dashboard from '../../assets/Icons/Dashboard.svg';
import logo from '../../assets/red_logo.svg';
import { getAllEvents } from '../../components/EventsViewer/EventHelpers';
import { useNotification } from '../../NotificationContext';
import {Icon} from '@iconify-icon/react';  
import Dash from './Dash/Dash';
import Members from './Members/Members';
import MeetingsManagement from "./MeetingManagement/MeetingManagement";
import {useFetch} from '../../hooks/useFetch';
import { use } from 'react';
import MeetingManagement from './MeetingManagement/MeetingManagement';

function ClubDash(){
    const [clubId, setClubId] = useState(useParams().id);
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const{isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState(null);

    const [currentPage, setCurrentPage] = useState('dash');
    const { addNotification } = useNotification();
    const [showDrop, setShowDrop] = useState(false);

    const [loadingIn, setLoadingIn] = useState(true);
    const orgData = useFetch(`/get-org-by-name/${clubId}`);
    const meetings = useFetch(`/get-meetings/${clubId}`);

    useEffect(()=>{
        if(orgData){
            setTimeout(() => {
                setLoadingIn(false);
            }, 1000);
        }
    },[orgData]);
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

    useEffect(()=>{
        if(orgData){
            if(orgData.error){
                addNotification({title: "Error", message: orgData.error, type: "error"});
                navigate('/');
            }
            if(orgData.data){
                console.log(orgData.data);
            }
        }
    }
    ,[orgData]);

    useEffect(()=>{ 
        if(meetings){
            if(meetings.error){
                addNotification({title: "Error", message: meetings.error, type: "error"});
            }
            if(meetings.data){
                console.log(meetings.data);
            }
        }
    },[meetings]);


    useEffect(()=>{
        if(!userInfo){
            return;
        }
        if(userInfo.clubAssociations){
            if(userInfo.clubAssociations.find(club => club.org_name === clubId)){
                return;
            } else {
                addNotification({title: "Unauthorized", message: "you are not authorized to manage this club", type: "error"});
                navigate('/');
            }
        }
    },[userInfo]);

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

    const openMembers = () =>{
        setCurrentPage('members');
    }

    const onOrgChange = (org) => {
        setLoadingIn(true);
        setClubId(org.org_name);
        setTimeout(() => {
            setLoadingIn(false);
        }, 500);
    }

    if(orgData.loading || loadingIn){
        return (
            <div className={`club-dash loading`}>
                <div className={`dash-left`}>
                    <div className="logo" onClick={()=>setShowDrop(!showDrop)}>
                        <h1>asdf</h1>
                        <Icon icon={`${showDrop ? "ic:round-keyboard-arrow-up" : "ic:round-keyboard-arrow-down"}`} width="24" height="24"  />
                    </div>
                    <nav className="nav">
                        <ul>
                            <li className= {`${currentPage === 'dash' ? 'selected' : ''}`} onClick={()=>setCurrentPage("dash")}>
                                <Icon icon="ic:round-dashboard" />
                                <p>Dashboard</p>
                            </li>
                            <li className={`${currentPage === "members" ? 'selected' : ''}`}  onClick = {()=>setCurrentPage('members')}>
                                <img src={Dashboard} alt="" />
                                <p>Members</p>
                            </li>
                            <li className={`${currentPage === "meetings" ? 'selected' : ''}`}  onClick = {()=>setCurrentPage('meetings')}>
                                <img src={Dashboard} alt="" />
                                <p>Meetings</p>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className={`dash-right ${expandedClass}`}>
                </div>
            </div>
        );
    }

    return (
        <div className={`club-dash ${loadingIn && "loading"}`}>
            <div className={`dash-left ${expanded && "hidden"}`}>
                <div className="logo" onClick={()=>setShowDrop(!showDrop)}>
                    <img src={orgData.data.org.overview.org_profile_image} alt="" />
                    <h1>{orgData.data.org.overview.org_name}</h1>
                    <Icon icon={`${showDrop ? "ic:round-keyboard-arrow-up" : "ic:round-keyboard-arrow-down"}`} width="24" height="24"  />
                    {
                        showDrop && 
                        <div className={`dropdown`} >
                            {
                                user && user.clubAssociations && user.clubAssociations.map((org, index)=>{
                                    return(
                                        <div className={`drop-option ${org.org_name === orgData.data.org.overview.org_name && "selected"}`} key={org._id} onClick={()=>onOrgChange(org)}>
                                            <img src={org.org_profile_image} alt="" />
                                            <p>{org.org_name}</p>
                                        </div>
                                    )
                                })
                            }
                            <button className="create-org">
                                <p>new organization</p>
                            </button>
                        </div>
                    }
                </div>
                <nav className="nav">
                    <ul>
                        <li className= {`${currentPage === 'dash' ? 'selected' : ''}`} onClick={()=>setCurrentPage("dash")}>
                            <Icon icon="ic:round-dashboard" />
                            <p>Dashboard</p>
                        </li>
                        <li className={`${currentPage === "members" ? 'selected' : ''}`}  onClick = {()=>setCurrentPage('members')}>
                            <img src={Dashboard} alt="" />
                            <p>Members</p>
                        </li>
                        <li className={`${currentPage === "meetings" ? 'selected' : ''}`}  onClick = {()=>setCurrentPage('meetings')}>
                                <img src={Dashboard} alt="" />
                                <p>Meetings</p>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className={`dash-right ${expandedClass}`}>
    
                {
                    currentPage === "dash" &&
                    <Dash expandedClass={expandedClass} openMembers={openMembers} clubName={clubId} meetings={meetings.data}/> 
                }
                {
                    currentPage === 'members' && 
                    <Members expandedClass = {expandedClass} people={orgData.data.org.members} positions={orgData.data.org.overview.positions}/>
                }
                {
                    currentPage =="meetings" &&
                    <MeetingManagement expandedClass = {expandedClass}  meetings={meetings.data} onExpand={onExpand}/>
                }
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    )
}


export default ClubDash;
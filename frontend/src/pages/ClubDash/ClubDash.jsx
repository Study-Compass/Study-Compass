import React, { useEffect, useState} from 'react';
import './ClubDash.scss';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import logo from '../../assets/red_logo.svg';
import { getAllEvents } from '../../components/EventsViewer/EventHelpers';
import { useNotification } from '../../NotificationContext';
import {Icon} from '@iconify-icon/react';  
import Dash from './Dash/Dash';
import Members from './Members/Members';
import Roles from './Roles/Roles';
import Testing from './Testing/Testing';
import {useFetch} from '../../hooks/useFetch';
import { use } from 'react';
import OrgDropdown from './OrgDropdown/OrgDropdown';
import Dashboard from '../../components/Dashboard/Dashboard';
import orgLogo from '../../assets/Brand Image/OrgLogo.svg';

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

    const orgData = useFetch(`/get-org-by-name/${clubId}?exhaustive=true`);
    const meetings = useFetch(`/get-meetings/${clubId}`);

    useEffect(()=>{
        if(orgData){

        }
    },[orgData]);

    const menuItems = [
        { label: 'Dashboard', icon: 'ic:round-dashboard' },
        { label: 'Members', icon: 'mdi:account-group' },
        { label: 'Roles', icon: 'mdi:shield-account' },
        { label: 'Testing', icon: 'mdi:test-tube' },
    ];

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
        setClubId(org.org_name);

    }
    

    if(orgData.loading){
        return (
            <Dashboard menuItems={menuItems} additionalClass='club-dash' middleItem={<OrgDropdown showDrop={showDrop} setShowDrop={setShowDrop} user={user} currentOrgName={clubId} onOrgChange={onOrgChange}/>} logo={orgLogo} secondaryColor="#EDF6EE" primaryColor="#4DAA57">
                <div className="loading-container"></div>
                <div className="loading-container"></div>
                <div className="loading-container"></div>
            </Dashboard>
        );
    }

    return (
        <Dashboard menuItems={menuItems} additionalClass='club-dash' middleItem={<OrgDropdown showDrop={showDrop} setShowDrop={setShowDrop} user={user} currentOrgName={clubId} onOrgChange={onOrgChange}/>} logo={orgLogo} secondaryColor="#EDF6EE" primaryColor="#4DAA57">
            <Dash expandedClass={expandedClass} openMembers={openMembers} clubName={clubId} meetings={meetings.data} org={orgData.data}/> 
            <Members expandedClass={expandedClass} />
            <Roles expandedClass={expandedClass} org={orgData.data.org.overview}/>
            <Testing expandedClass={expandedClass} org={orgData.data.org.overview}/>
        </Dashboard>
    )
}


export default ClubDash;
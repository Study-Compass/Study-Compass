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

    const orgData = useFetch(`/get-org-by-name/${clubId}`);
    const meetings = useFetch(`/get-meetings/${clubId}`);

    useEffect(()=>{
        if(orgData){

        }
    },[orgData]);

    const menuItems = [
        { label: 'Dashboard', icon: 'ic:round-dashboard' },
        { label: 'Members', icon: 'mdi:account-group' },
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
            <Dashboard menuItems={menuItems} additionalClass='club-dash' middleItem={<OrgDropdown showDrop={showDrop} setShowDrop={setShowDrop} user={user} currentOrgName={clubId} onOrgChange={onOrgChange}/>} logo={orgLogo}>
                <div className="loading-container"></div>
                <div className="loading-container"></div>

            </Dashboard>
        );
    }

    return (
        <Dashboard menuItems={menuItems} additionalClass='club-dash' middleItem={<OrgDropdown showDrop={showDrop} setShowDrop={setShowDrop} user={user} currentOrgName={clubId} onOrgChange={onOrgChange}/>} logo={orgLogo}>
            <Dash expandedClass={expandedClass} openMembers={openMembers} clubName={clubId} meetings={meetings.data}/> 
            <Members expandedClass = {expandedClass} people={orgData.data.org.members} positions={orgData.data.org.overview.positions}/>
        </Dashboard>
    )
}


export default ClubDash;
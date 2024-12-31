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
import {useFetch} from '../../hooks/useFetch';
import { use } from 'react';

function ClubDash(){
    const clubId = useParams().id;
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const{isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState(null);

    const [currentPage, setCurrentPage] = useState('dash');
    const { addNotification } = useNotification();

    const orgData = useFetch(`/get-org-by-name/${clubId}`);

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

    if(orgData.loading){
        return null;
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
                    <Dash expandedClass={expandedClass} openMembers={openMembers} clubName={clubId}/> 
                }
                {
                    currentPage === 'members' && 
                    <Members expandedClass = {expandedClass} people={orgData.data.org.members} positions={orgData.data.org.overview.positions}/>
                }
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    )
}


export default ClubDash;
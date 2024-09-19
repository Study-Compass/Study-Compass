import React, { useEffect, useState } from 'react';
import './Banner.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Badges from '../Badges/Badges.jsx';
import x_white from '../../assets/x_white.svg';
import { useWebSocket } from '../../WebSocketContext.js';

function Banner({visible, setVisible, bannerType}) {
    const { isAuthenticating, isAuthenticated, user, checkedIn } = useAuth();
    const { emit, on, off } = useWebSocket(); 
    const navigate = useNavigate();
    const [checkedInClassroom, setCheckedInClassroom] = useState(null);

    const onCheckOut = () => {
        setVisible(false);
    }

    useEffect(() => {
        if (!isAuthenticating && !isAuthenticated) {
            setVisible(true);   
        } else if(checkedIn){
            console.log(checkedIn);
            setCheckedInClassroom(checkedIn.classroom);
            setVisible(true);
            emit('join-classroom', checkedIn._id);
            on('check-out', onCheckOut);
        }

    }, [isAuthenticating, isAuthenticated, checkedIn]);



    const handleCheckInClick = () => {
        navigate(`/room/${checkedIn.name}`);
        window.location.reload();
    }


    if(!isAuthenticated && !isAuthenticating){
        return(
            <div className={`banner ${visible && "visible"}`}>
                create an account now for the <Badges badges={["beta tester"]}/> badge! 
                <div className="exit"><img src={x_white} onClick={()=>{setVisible(false)}} alt="" /></div>
            </div>
        )
    } else if(checkedInClassroom !== null){
        return(
            <div className={`banner ${visible && "visible checked-in"}`} onClick={handleCheckInClick}>
                you are checked in to {checkedIn.name}
                <div className="exit"><img src={x_white} onClick={()=>{setVisible(false)}} alt="" /></div>
            </div>
        )
    } 
    else{
        return null;
    }
}

export default Banner;
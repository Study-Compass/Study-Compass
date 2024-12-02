import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './NewBadge.scss';
import { useNotification } from '../../NotificationContext';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import postRequest from '../../utils/postRequest';

const NewBadge = () => {
    const { hash } = useParams();
    const { user, isAuthenticating, isAuthenticated } = useAuth();
    const location = useLocation();
    const {reloadNotification} = useNotification();
    const [redLoaded, setRedLoaded] = useState(false);
    const [yellowLoaded, setYellowLoaded] = useState(false);
    const [show, setShow] = useState(false);
    const [start, setStart] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setStart(true);
        }, 500);
    }, []);
    useEffect(() => {
        if(redLoaded && yellowLoaded){
            setShow(true);
        }
    }, [redLoaded, yellowLoaded]);

    useEffect(() => {
        if(isAuthenticated){
            const response = postRequest('/verify-new-badge', {hash: hash});
            if(response.error){
                console.log(response.error);
            } else {
                console.log(response);
            }
        } else {
            return;
        }
    }, [isAuthenticated, user ]);
    

    if(isAuthenticating){  
        return null;
    }
    
    if (!user) {
        reloadNotification({title: "Please login to access this page", message: "You will be redirected to the login page", type: "error"});
        setTimeout(() => {
            window.location.reload();
        }, 100);
        return <Navigate to="/login" state={{ from: location }} replace/>;
    } 


    return (
        <div className={`new-badge ${start && show ?"visible" : ""}`}>
            <img src={YellowRedGradient} alt="" className="yellow-red" onLoad={()=>{setYellowLoaded(true)}}/>
            <img src={PurpleGradient} alt="" className="purple" onLoad={()=>{setRedLoaded(true)}}/>
            <div className="content">

            </div>

        </div>
    );
};

export default NewBadge;
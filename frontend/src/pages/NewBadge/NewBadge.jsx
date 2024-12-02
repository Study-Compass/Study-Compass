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
    const navigate = useNavigate();
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
        localStorage.setItem('badge', location.pathname);
        return <Navigate to="/login" state={{ from: location }} replace/>;
    } 

    const onClaim = async () => {
        await validateToken();
        setClaimed(true);
    }


    return (
        <div className={`new-badge ${start && show ?"visible" : ""}`}>
            <img src={YellowRedGradient} alt="" className="yellow-red" onLoad={()=>{setYellowLoaded(true)}}/>
            <img src={PurpleGradient} alt="" className="purple" onLoad={()=>{setRedLoaded(true)}}/>
            <div className="content">
                {claimed ? 
                    <div className="claimed">
                        <h1>badge claimed!</h1>
                        <p>your badge has been added to your profile. Check it out!</p>
                        <CardHeader userInfo={user} />
                        <button onClick={()=>navigate('/room/none')}>go home</button> 
                    </div>
                    :
                    <>
                        {
                            error ? 
                            <div className="badge-error">
                                <h1>Oops! Looks like there's been an error</h1>
                                <p>{error}</p>
                                <button onClick={()=>navigate('/room/none')}>go home</button>
                            </div>
                            :
                            <div className="success">
                                {badge && 
                                    <div className={`mock-badge ${badgeVisible && "visible"}`}style={{backgroundColor: badge.badgeColor}}>
                                        {badge.badgeContent}
                                    </div>
                                }
                                <h1 className={`${!contentVisible && "invis"}`}>claim your new badge!</h1>
                                <p className={`${!contentVisible && "invis"}`}>Thank you for attending the RCOS expo 🎉. To express our thanks, we’d like to gift you a limited RCOS badge, wear it proudly on your profile! </p>
                                <button onClick={onClaim} className={`${!contentVisible && "invis"}`}>claim</button>

                            </div>
                        }
                    </>
                }
            </div>

        </div>
    );
};

export default NewBadge;
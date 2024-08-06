import React, { useEffect, useState } from 'react';
import './Banner.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Badges from '../Badges/Badges.jsx';
import x_white from '../../assets/x_white.svg';

function Banner() {
    const { isAuthenticating, isAuthenticated, user } = useAuth();

    const [visible, setVisible] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticating && !isAuthenticated) {
            setVisible(true);
        }
    }, [isAuthenticating, isAuthenticated]);


    return(
        <div className={`banner ${visible && "visible"}`} onClick={()=>{navigate('/register')}}>
            create an account now for the <Badges badges={["beta tester"]}/> badge! 
            <div className="exit"><img src={x_white} onClick={()=>{setVisible(false)}} alt="" /></div>
        </div>
    )
}

export default Banner;
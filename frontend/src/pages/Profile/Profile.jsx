import React, { useEffect, useState } from 'react';
import './Profile.scss';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer.jsx';
import ProfileCard from '../../components/ProfileCard/ProfileCard';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

function Profile(){
    const{isAuthenticated, isAuthenticating, user} = useAuth();
    const navigate  = useNavigate();
    const [userInfo, setUserInfo] = useState(null);

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

    return (
        <div className="profile">
            <Header/>
            {userInfo &&   
                <div className="content-container">
                    <div className="profile-card">
                        <ProfileCard userInfo={userInfo}/>
                    </div>
                </div>
            }
            <Footer/>
        </div>
    )
}


export default Profile;
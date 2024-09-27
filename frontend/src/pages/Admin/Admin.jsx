import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import Analytics from '../../components/Analytics/Analytics';

import './Admin.scss';

function Admin(){
    const [userInfo, setUserInfo] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { isAuthenticating, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [showPage, setShowPage] = useState("");
    useEffect(() => {
        if (isAuthenticating) {
            return;
        }
        if (!isAuthenticated) {
            navigate("/login");
        }
        if (!user) {
            return;
        } else {
            setUserInfo(user);
            console.log(user);
        }
    }, [isAuthenticating, isAuthenticated, user]);

    useEffect(() => {
        if (userInfo) {
            if (!userInfo.admin) {
                navigate('/');
            }
            if (userInfo.admin) {
            }
        }
    }, [userInfo]);

    const toggleAnalytics = (page) => {
        if(showPage === page){
            setShowPage("");
            return;
        }
        setShowPage(page);
    }


    if(!userInfo){
        return(
            <div className="admin">
                <Header />
            </div>
        );
    }
    return(
        <div className="admin">
            <Header />
            <div className="content">
                <div className="header">
                    <h1>admin dashboard</h1>
                    <div className="options">
                        <button onClick={() => toggleAnalytics("analytics")}>
                            analytics
                        </button>
                        <button onClick={() => toggleAnalytics("users")}>
                            users
                        </button>
                    </div>
                </div>
                {
                    showPage === "analytics" && <Analytics />
                }
            </div>
        </div>
    );
}

export default Admin
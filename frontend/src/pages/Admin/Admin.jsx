import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import useAuth from '../../hooks/useAuth';

import './Admin.css';

function Admin(){
    const [userInfo, setUserInfo] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const { isAuthenticating, isAuthenticated, user } = useAuth();
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
            <h1>Admin</h1>
        </div>
    );
}
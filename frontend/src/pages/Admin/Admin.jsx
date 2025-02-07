import React, { useEffect, useState } from 'react';
import Header from '../../components/Header/Header';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BlueGrad1 from '../../assets/BlueGrad1.png';
import BlueGrad2 from '../../assets/BlueGrad2.png';

import Analytics from '../../components/Analytics/Analytics';

import './Admin.scss';

function Admin(){
    const { user } = useAuth();

    const [showPage, setShowPage] = useState("analytics");

    const toggleAnalytics = (page) => {
        if(showPage === page){
            setShowPage("");
            return;
        }
        setShowPage(page);
    }

    if(!user){
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
                <div className="banner">
                    <h1>admin dashboard</h1>
                    <img src={BlueGrad1} alt="" className="tr"/>
                    <img src={BlueGrad2} alt="" className="bl"/>

                </div>
                <div className="options">
                    <button className={`${showPage === "analytics" ? "selected" : ""}`} onClick={() => toggleAnalytics("analytics")}>
                        analytics
                    </button>
                    <button className={`${showPage === "users" ? "selected" : ""}`} onClick={() => toggleAnalytics("users")}>
                        users
                    </button>
                </div>
                {
                    showPage === "analytics" && <Analytics />
                }
            </div>
        </div>
    );
}

export default Admin
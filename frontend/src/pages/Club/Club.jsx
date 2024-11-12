import React from 'react';
import './Club.scss';
import Header from '../../components/Header/Header';
import rpiLogo from "../../assets/Icons/rpiLogo.svg";


const Club = () => {
    return (
        <div className="club-page">
            <Header />
            <div className="top-header-box">
                <div className="club-logo">
                    <img src={rpiLogo} alt=""/>
                </div>
            </div>
                <div className="club-info">

                    <div className="club-header">
                        <h2 className="name">Club Name</h2>
                        <div className="status">Union Recognized</div>
                    </div>

                    <p className="description">
                        description of the club blah blah blah blah blah
                    </p>
                    <div className="actions">
                        <button>Join</button>
                        <button>Follow</button>
                    </div>
                    <div className="stats">
                        <div>250 followers • 50 members</div>
                    </div>
                </div>

            
        </div>
    );
};

export default Club;

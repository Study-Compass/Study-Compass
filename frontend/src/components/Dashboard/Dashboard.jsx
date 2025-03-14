import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/Brand Image/EventsLogo.svg';
import defaultAvatar from '../../assets/defaultAvatar.svg';
import useAuth from '../../hooks/useAuth';
import { Icon } from '@iconify-icon/react';
import './Dashboard.scss'

function Dashboard({ menuItems, children, additionalClass = '' }) {
    const [expanded, setExpanded] = useState(false);
    const [expandedClass, setExpandedClass] = useState("");
    const [currentDisplay, setCurrentDisplay] = useState(0);
    const navigate = useNavigate();

    const {user} = useAuth();

    const onExpand = () => {
        setExpanded(prev => !prev);
        setExpandedClass(expanded ? "minimized" : "maximized");
    }

    return (
        <div className={`general-dash ${additionalClass}`}>
            <div className={`dash-left ${expanded ? "hidden" : ""}`}>
                <div className="top">
                    <div className="logo">
                        <img src={logo} alt="Logo" />
                    </div>
                    <nav className="nav">
                        <ul>
                            {menuItems.map((item, index) => (
                                <li key={index} className={`${currentDisplay === index ? "selected" : ""}`} onClick={() => setCurrentDisplay(index)}>
                                    <Icon icon={item.icon} />
                                    <p>{item.label}</p>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
                <div className="bottom">
                    <div className="user">
                        <div className="avatar">
                            <img src={user.image || defaultAvatar} alt="User Avatar" />
                        </div>
                        <div className="user-info">
                            <p className="username">{user.name}</p>
                            <p className="email">{user.email}</p>
                        </div>
                    </div>
                    <div className="back" onClick={() => navigate('/room/none')}>
                        <Icon icon="ep:back" />
                        <p>Back to Study Compass</p>
                    </div>
                </div>
            </div>
            <div className={`dash-right ${expandedClass}`}>
                {children[currentDisplay]}
                <div className={`expand`} onClick={onExpand}>
                    <Icon icon="material-symbols:expand-content-rounded" />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;

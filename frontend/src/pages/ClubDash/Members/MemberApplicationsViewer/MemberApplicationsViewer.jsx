import React, { useState } from 'react';
import './MemberApplicationsViewer.scss';
import HeaderContainer from '../../../../components/HeaderContainer/HeaderContainer';
import pfp from '../../../../assets/defaultAvatar.svg'

const formatDate = (date) => {
    return `${date.toLocaleString('default', {weekday: 'long'})}, ${date.toLocaleString('default', {month: 'long'})} ${date.getDate()}`;
}

function MemberApplicationsViewer({ applications }) {
    const [selectedApplication, setSelectedApplication] = useState(null);
    const users = applications.map(app => {
        const userApp = {...app.user_id};
        userApp.application = app;
        return userApp;
    });
    const onApplicationSelect = (id) => {
        setSelectedApplication(applications.find(app => app.user_id._id === id));
    }
    return (
        <div className="member-applications-viewer">
            <HeaderContainer 
                header='Member applications'
                icon='mdi:account-group'
            >
                <div className="member-applications-content">
                    <div className="applicants">
                        {
                            users.map(user => (
                                <div className="user" key={user._id} onClick={() => onApplicationSelect(user._id)}>
                                    <div className="row">
                                        <img src={user.picture ? user.picture : pfp} alt="" />
                                        <div className="user-info">
                                            <h4>{user.name}</h4>
                                            <p>{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="row apply-info">
                                        <p>Applied on {formatDate(new Date(user.application.createdAt))}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                    <div className="workspace">
                        {
                            selectedApplication && (
                                <div className="application-viewer">
                                    <div className="row">
                                        {selectedApplication.status}
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </HeaderContainer>
        </div>
    );
}

export default MemberApplicationsViewer;
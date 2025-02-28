import React, { useEffect, useState } from 'react';
import './ManageFlow.scss';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';


function ManageFlow(){
    return (
        <div className="dash manage-flow">
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>Manage Approval Flow</h1>
                <p>Define the way approvals work</p>
            </header>
        </div>
    )
}

export default ManageFlow;
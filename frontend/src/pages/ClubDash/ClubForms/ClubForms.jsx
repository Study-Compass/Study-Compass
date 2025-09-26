import React, { useState, useEffect } from 'react';
import './ClubForms.scss';
import { useFetch } from '../../../hooks/useFetch';
import OrgGrad from '../../../assets/Gradients/OrgGrad.png';


const ClubForms = ({ org }) => {
    const { data: forms, loading, error } = useFetch(`/${org._id}/forms`);
    return (
        <div className="club-forms dash">
            <header className="header">
                <h1>Club Forms</h1>
                <p>Create and manage forms for your club</p>
                <img src={OrgGrad} alt="" />

            </header>
                    <button>
                        Create Form
                    </button>
            <div className="club-forms-or-templates">
                <div className="club-forms-or-templates-header">   
                    <button>Forms</button>
                    <button>Templates</button>
                </div>
                <div className="boarder"></div>
            </div>

            <div className="form-container">
        
                <div className="form-body">
                    <h1>Title of the form</h1>
                    <div className="boarder"></div>
                    <p className="form-date">Created:</p>
                    <p># of submission</p>
                    <div className="form-actions">
                        <button>Copy Link</button>
                        <button>Open</button>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}

export default ClubForms;
import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './Approval.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function Approval({approval}){
    return(
        <div className="approval col">
            <div className="row">
                <div className="col">
                    <h3>{approval.role}</h3>
                    <div className="approval-status low">
                        <p className="low">0 pending approvals</p>
                    </div>
                </div>
            </div>
            <div className="row info">
                <div className="col criteria">
                    <div className="header">
                        <p>Approval Criteria</p>
                    </div>
                    <div className="content">
            
                    </div>
                </div>
                <div className="col actions">
                    <button className="button"> 
                        <Icon icon="material-symbols:arrow-outward-rounded"/>
                        <p>dashboard</p>
                    </button>
                    <button className="button"> 
                        <Icon icon="material-symbols:expand-content-rounded" />
                        <p>details</p>
                    </button>

                </div>
            </div>
        </div>
    )
}
    
export default Approval;
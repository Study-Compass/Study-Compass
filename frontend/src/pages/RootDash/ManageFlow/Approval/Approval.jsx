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
                    <p>0 pending approvals</p>
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
                    <button> 
                        <Icon icon="material-symbols:arrow-outward-rounded" width="24" height="24" />
                        <p>asdf</p>
                    </button>
                </div>
            </div>
        </div>
    )
}
    
export default Approval;
import React, { useEffect, useState } from 'react';
import './NewApproval.scss';
import Flag from '../../../../components/Flag/Flag';
import postRequest from '../../../../utils/postRequest';

function NewApproval(){
    const [approvalName, setApprovalName] = useState('');
    const [usernames, setUsernames] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        const response = await postRequest('/add-approval', {role: approvalName, usernames: usernames.split(' ')});
        console.log(response);

    }
    return (
        <div className="new-approval">
            <div className="header">
                <h2>New Approval Role</h2>
                <p>create a new approval</p>
            </div>
            <Flag text="Administrators with this role will be prompted to create their own criteria and approval process." primary="rgba(235,226,127,0.32)" accent='#B29F5F' color="#B29F5F" icon={'lets-icons:info-alt-fill'}/>
            <form onSubmit={onSubmit} className="content">
                <div className="field">
                    <label htmlFor="approval-name">Approval Name</label>
                    <input type="text" name="approval-name" id="approval-name" className="short" value={approvalName} onChange={(e)=>setApprovalName(e.target.value)}/>
                </div>
                <div className="field">
                    <label htmlFor="approval-name">add usernames</label>
                    <input type="text" name="approval-name" id="approval-name" className="short" value={usernames} onChange={(e)=>setUsernames(e.target.value)}/>
                </div>
                <button type="submit">
                    submit
                </button>
            </form>
        </div>
    )
}

export default NewApproval;
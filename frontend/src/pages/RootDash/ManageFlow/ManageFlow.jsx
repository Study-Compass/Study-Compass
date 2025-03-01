import React, { useEffect, useState } from 'react';
import './ManageFlow.scss';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import {useFetch} from '../../../hooks/useFetch';
import Approval from './Approval/Approval';

function ManageFlow(){
    const flowData = useFetch('/get-approval-flow');
    
    useEffect(()=>{
        if(flowData.data){
            console.log(flowData.data);
        }
        if(flowData.error){
            console.log(flowData.error);
        }
    },[flowData])

    return (
        <div className="dash manage-flow">
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>Manage Approval Flow</h1>
                <p>Define the way approvals work</p>
            </header>
            <div className="content">
                <div className="approvals">
                    <div className="container-header">
                        <div className="approval-left">
                            <Icon icon="icon-park-solid:check-one"/>
                            <h2>approvals</h2>
                        </div>
                        <button onClick={console.log}>
                            <Icon icon="fluent:flow-16-filled"/>
                            <p>edit workflow</p>
                        </button>
                    </div>
                    <div className="container">
                        {
                            !flowData.loading && flowData.data && flowData.data.data.steps.map((approval, index) => {
                                return <Approval key={index} approval={approval}/>
                            })
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ManageFlow;
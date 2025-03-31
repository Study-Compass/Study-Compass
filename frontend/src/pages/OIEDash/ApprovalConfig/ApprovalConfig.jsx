import React, {useEffect, useState} from 'react';
import './ApprovalConfig.scss';
import { useFetch } from '../../../hooks/useFetch';
import Select from '../../../components/Select/Select';

const ApprovalConfig = ({ }) => {
    //nuanced search based on login items
    const approvalSteps = useFetch('/get-approval-steps');
    
    const [steps, setSteps] = useState([])
    const [selectedStep, setSelectedStep] = useState(null);

    const onChange= (option) => {
        console.log(steps.find((step)=>step.role === option))
        setSelectedStep(steps.find((step)=>step.role === option));
    }

    useEffect(()=>{
        if(approvalSteps.data){
            setSteps(approvalSteps.data.steps);
        }
        if(approvalSteps.error){
            console.log(approvalSteps.error);
        }
    },[approvalSteps]);

    return(
        <div className="approval-config">
            <div className="header">
                <h1>Approval Configuration</h1>
            </div>
            <div className="config-content">
                <div className="config-header">
                    <Select
                        options={steps.map((step, i)=>step.role)}
                        onChange={onChange}
                        defaultValue={"Select an approval step"}
                    />
                </div>
                <div className="config-container">
                    {
                        selectedStep && 
                        <div className="config-container-content">
                            <div className="approval-criteria">
                                <h2>Approval Criteria</h2>
                                    {
                                        Object.keys(selectedStep.criteria).map((criteria, i)=>{
                                            return(
                                                <div className="criteria-item" key={i}>
                                                    <p>{criteria}</p>
                                                </div>  
                                            )
                                        })
                                    }
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default ApprovalConfig;  
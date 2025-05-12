import React, {useEffect, useState} from 'react';
import './ApprovalConfig.scss';
import { useFetch } from '../../../hooks/useFetch';
import Select from '../../../components/Select/Select';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import FormBuilder from '../../../components/FormBuilder/FormBuilder';
import FormViewer from '../../../components/FormViewer/FormViewer';
import Popup from '../../../components/Popup/Popup';

const ApprovalConfig = ({ }) => {
    const approvalSteps = useFetch('/get-approval-steps');
    const [steps, setSteps] = useState([]);
    const [selectedStep, setSelectedStep] = useState(null);
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [showFormViewer, setShowFormViewer] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);

    const onChange = (option) => {
        console.log(steps.find((step)=>step.role === option));
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

    const handleFormSave = (form) => {
        console.log('Form saved:', form);
        setCurrentForm(form);
        setShowFormBuilder(false);
    };

    const handleFormSubmit = (responses) => {
        console.log('Form responses:', responses);
        setShowFormViewer(false);
    };

    const mockForm = {
        title: "Approval Feedback Form",
        description: "Please provide feedback about this approval request",
        questions: [
            {
                id: "1",
                type: "short",
                question: "What is your name?",
                required: true
            },
            {
                id: "2",
                type: "multiple_choice",
                question: "What is your decision?",
                required: true,
                options: ["Approve", "Reject", "Request Changes"]
            },
            {
                id: "3",
                type: "long",
                question: "Please provide any additional comments or feedback",
                required: false
            }
        ]
    };

    return(
        <div className="approval-config">
            <div className="header">
                <h1>Approval Configuration</h1>
                <div className="form-buttons">
                    <button onClick={() => {
                        if(!currentForm){
                            setCurrentForm(mockForm);
                        }
                        setShowFormBuilder(true);
                        }}>Create Approval Form</button>
                    <button onClick={() => {
                        if(!currentForm){
                            setCurrentForm();
                        }
                        setShowFormViewer(true);
                    }}>View Sample Form</button>
                </div>
            </div>
            <div className="approval-container">
                <Select
                    options={steps.map((step, i)=>step.role)}
                    onChange={onChange}
                    defaultValue={"Select an approval step"}
                />
                <div className="config-content">
                    <div className="config-header">
                        <div className='row'>
                            <Icon icon="mage:wrench-fill" />
                            <h2>configuration</h2>
                        </div>
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

            <Popup isOpen={showFormBuilder} onClose={() => setShowFormBuilder(false)} customClassName="wide-content">
                <FormBuilder initialForm={currentForm} onSave={handleFormSave} />
            </Popup>

            <Popup isOpen={showFormViewer} onClose={() => setShowFormViewer(false)} customClassName="wide-content">
                <FormViewer form={currentForm} onSubmit={handleFormSubmit} />
            </Popup>
        </div>
    )
}

export default ApprovalConfig;
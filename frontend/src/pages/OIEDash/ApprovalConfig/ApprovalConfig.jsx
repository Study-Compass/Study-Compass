import React, {useEffect, useState} from 'react';
import './ApprovalConfig.scss';
import { useFetch } from '../../../hooks/useFetch';
import Select from '../../../components/Select/Select';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import FormBuilder from '../../../components/FormBuilder/FormBuilder';
import FormViewer from '../../../components/FormViewer/FormViewer';
import Popup from '../../../components/Popup/Popup';
import HeaderContainer from '../../../components/HeaderContainer/HeaderContainer';
import SlideSwitch from '../../../components/SlideSwitch/SlideSwitch';
import ApprovalCriteria from './ApprovalCriteria/ApprovalCriteria';

const ApprovalConfig = ({ approvalId }) => {
    const approvalSteps = useFetch('/get-approval-steps');
    const [steps, setSteps] = useState([]);
    const [selectedStep, setSelectedStep] = useState(steps.find((step)=>step.role === approvalId));
    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [showFormViewer, setShowFormViewer] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);

    const [conditionalApproval, setConditionalApproval] = useState(true); //temporary for demo, make this dynamic

    const onChange = (option) => {
        setSelectedStep(steps.find((step)=>step.role === option));
    }

    useEffect(()=>{
        if(approvalSteps.data){
            setSteps(approvalSteps.data.steps);
            setSelectedStep(approvalSteps.data.steps.find((step)=>step.role === approvalId));
        }
        if(approvalSteps.error){
            console.log(approvalSteps.error);
        }
    },[approvalSteps.data]);

    useEffect(()=> {console.log(selectedStep)}, [selectedStep])

    const handleFormSave = (form) => {
        setCurrentForm(form);
        setShowFormBuilder(false);
    };

    const handleFormSubmit = (responses) => {
        setShowFormViewer(false);
    };

    const mockForm = {
        title: "Heffner Alumni House Form",
        description: "The space you requested requires additional information, please fill out the form below.",
        questions: [
            {
                id: "1",
                type: "short",
                question: "Will you require catering?",
                required: true
            },
            {
                id: "2",
                type: "multiple_choice",
                question: "example multiple choice question",
                required: true,
                options: ["Approve", "Reject", "Request Changes"]
            },
            {
                id: "3",
                type: "long",
                question: "Please provide any additional comments or feedback",
                required: false
            },
            {
                id: "5",
                type: "select_multiple",
                question: "example select all choice question",
                required: true,
                options: ["Option 1", "Option 2", "Option 3"]
            },
        ]
    };

    const hasStepChanged = (selectedStep) => {
        console.log('asdf');
        return JSON.stringify(selectedStep) === JSON.stringify(steps.find((step)=>step.role === approvalId));
    }

    const handleCriteriaChange = (index, key, value) => {
        const newCriteria = [...selectedStep.criteria]
        console.log(newCriteria);
        newCriteria[index] = {_id:selectedStep.criteria[index]._id,[key]: value};
        console.log(newCriteria);
        setSelectedStep({...selectedStep, criteria:newCriteria})
    }

    if(!selectedStep){
        return null;
    }

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
                        }}>Edit Approval Form</button>
                    <button onClick={() => {
                        if(!currentForm){
                            setCurrentForm();
                        }
                        setShowFormViewer(true);
                    }}>View Sample Form</button>
                </div>
            </div>
            <div className="config-item">
                <div className="config-title">
                    <SlideSwitch checked={conditionalApproval} onChange={()=>setConditionalApproval(!conditionalApproval)}/>
                    <h2>Conditional Approval</h2>
                </div>
                {
                    conditionalApproval && 
                    <div className="approval-container">
                        <HeaderContainer icon="mage:wrench-fill" header="approval conditions" subheader="Configure the approval process for your organization" right={hasStepChanged(selectedStep) ? null : <>save</>}>
                            <div className="config-container-content">
                                {/* <div className="approval-criteria"> */}
                                    {
                                        selectedStep.criteria.map((criteriaItem, i)=>{
                                            return(
                                                <ApprovalCriteria key={`${criteriaItem}${i}`} criteria={criteriaItem} onChange={(key, value) => handleCriteriaChange(i, key, value)} approvalKey={criteriaItem} />
                                            )
                                        })
                                    }
                                {/* </div> */}
                            </div>
                        </HeaderContainer>
                    </div>
                }
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
import React from 'react';
import './CustomFormFill.scss';
import { useNotification } from '../../../NotificationContext';
import FormViewer from '../../FormViewer/FormViewer';


const form = {
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

const CustomFormFill = ({ next, visible }) => {
    const {addNotification} = useNotification();
    return (
        <div className={`custom-form-fill create-component ${visible && "visible"}`}>
            <div className="form-fill-header">
                <FormViewer form={form}/>
            </div>
            <button className={`next-button ${true && "active"}`} onClick={next}>
                next
            </button>
        </div>
    )
}

export default CustomFormFill;
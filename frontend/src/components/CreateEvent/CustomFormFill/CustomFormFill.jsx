import React, { useState, useEffect } from 'react';
import './CustomFormFill.scss';
import { useNotification } from '../../../NotificationContext';
import FormViewer from '../../FormViewer/FormViewer';

const form = {
    title: "Darrin Communications Center Form",
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
            question: "What type of event is this?",
            required: true,
            options: ["Academic", "Social", "Professional", "Other"]
        },
        {
            id: "3",
            type: "long",
            question: "Please provide any additional comments or special requirements",
            required: false
        },
        {
            id: "5",
            type: "select_multiple",
            question: "What equipment will you need?",
            required: true,
            options: ["Projector", "Microphone", "Speakers", "Tables", "Chairs"]
        },
    ]
};

const CustomFormFill = ({ formData, setFormData, onComplete }) => {
    const { addNotification } = useNotification();
    const [formResponses, setFormResponses] = useState(formData.customFormData || {});

    // Update local state when formData changes
    useEffect(() => {
        if (formData.customFormData !== formResponses) {
            setFormResponses(formData.customFormData || {});
        }
    }, [formData.customFormData]);

    useEffect(() => {
        // Validate required questions
        const requiredQuestions = form.questions.filter(q => q.required);
        const isValid = requiredQuestions.every(q => 
            formResponses[q.id] && 
            (Array.isArray(formResponses[q.id]) ? formResponses[q.id].length > 0 : formResponses[q.id].trim() !== '')
        );
        
        onComplete(isValid);
        
        setFormData(prev => ({
            ...prev,
            customFormData: formResponses
        }));
    }, [formResponses, onComplete, setFormData]);

    const handleFormSubmit = (responses) => {
        setFormResponses(responses);
        addNotification({
            title: "Form Completed",
            message: "Your form responses have been saved",
            type: "success"
        });
    };

    const handleResponseChange = (questionId, value) => {
        setFormResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    return (
        <div className="custom-form-fill create-component">
            <div className="form-fill-header">
                <div className="form-viewer">
                    <div className="form-header">
                        <h1>{form.title}</h1>
                        {form.description && <p>{form.description}</p>}
                    </div>

                    <div className="form-questions">
                        {form.questions.map((question) => (
                            <div key={question.id} className="question-container">
                                <div className="question-header">
                                    <h3>{question.question}</h3>
                                    {question.required && <span className="required">*</span>}
                                </div>
                                {renderQuestion(question, formResponses, handleResponseChange)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const renderQuestion = (question, responses, handleResponseChange) => {
    switch (question.type) {
        case 'short':
            return (
                <input
                    type="text"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    required={question.required}
                />
            );
        case 'long':
            return (
                <textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Your answer"
                    required={question.required}
                />
            );
        case 'multiple_choice':
            return (
                <div className="options-list">
                    {question.options.map((option, index) => (
                        <label key={index} className="option-label">
                            <input
                                type="radio"
                                name={question.id}
                                value={option}
                                checked={responses[question.id] === option}
                                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                                required={question.required}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            );
        case 'select_multiple':
            return (
                <div className="options-list">
                    {question.options.map((option, index) => (
                        <label key={index} className="option-label">
                            <input
                                type="checkbox"
                                value={option}
                                checked={(responses[question.id] || []).includes(option)}
                                onChange={(e) => {
                                    const currentValues = responses[question.id] || [];
                                    const newValues = e.target.checked
                                        ? [...currentValues, option]
                                        : currentValues.filter(v => v !== option);
                                    handleResponseChange(question.id, newValues);
                                }}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            );
        default:
            return null;
    }
};

export default CustomFormFill;
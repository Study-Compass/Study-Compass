import React, { useState, useEffect } from 'react';
import Popup from '../Popup/Popup';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import './FlowComponentV2.scss';
// import Logo from '../../assets/Brand Image/Beacon.svg';
// import { Icon } from '@iconify/react/dist/iconify.js';
// import Icon from '../../assets/Icons/Bookmark.svg';


const FlowComponentV2 = ({
    steps, // array of objects with id, title, description, component
    formData, // object with form data
    setFormData, // function to set form data
    onSubmit, // function to handle form submission
    headerTitle,
    headerSubtitle,
    submitButtonText = 'Submit',
    submittingButtonText = 'Submitting...',
    continueButtonText = 'Continue',
    backButtonText = 'Back',
    className = '',
    onError = null,
    validationFunction = null, // Custom validation function
    onClose = null, // Function to handle closing the flow
    formConfig = null, // Form configuration for dynamic validation
    getMissingFields = null // Function to get missing fields
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stepValidation, setStepValidation] = useState(new Array(steps.length).fill(false));
    const [showMissingFields, setShowMissingFields] = useState(false);

    // Function to check if a step is completed based on form data
    const isStepCompleted = (stepIndex) => {
        // Use custom validation function if provided
        if (validationFunction) {
            return validationFunction(stepIndex, formData);
        }
        
        // Default validation for event creation
        switch(stepIndex) {
            case 0: // GenInfo
                return !!(formData.name && formData.description && formData.type && formData.visibility && formData.expectedAttendance > 0);
            case 1: // Where (room selection) - FIXED: Check selectedRoomIds instead of location
                return !!(formData.selectedRoomIds && formData.selectedRoomIds.length > 0);
            case 2: // When (time selection)
                return !!(formData.start_time && formData.end_time);
            case 3: // Review
                return !!(formData.contact && formData.OIEAcknowledgementItems && formData.OIEAcknowledgementItems.length > 0);
            default:
                return false;
        }
    };

    // Initialize validation state based on existing form data
    useEffect(() => {
        const initialValidation = steps.map((step, index) => isStepCompleted(index));
        setStepValidation(initialValidation);
    }, [formData, steps.length]);

    // Update validation when formData changes
    useEffect(() => {
        const newValidation = steps.map((step, index) => isStepCompleted(index));
        setStepValidation(newValidation);
    }, [formData, steps.length]);

    const handleStepComplete = (stepIndex, isValid) => {
        setStepValidation(prev => {
            const newValidation = [...prev];
            newValidation[stepIndex] = isValid;
            return newValidation;
        });
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        // Check if all steps are completed
        if (!canSubmit()) {
            // Show missing fields if available
            if (getMissingFields && formConfig) {
                const missingFields = getMissingFields(formData, formConfig);
                if (missingFields.length > 0) {
                    setShowMissingFields(true);
                    return;
                }
            }
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error in flow submission:', error);
            if (onError) {
                onError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = () => {
        if(!steps || steps.length === 0) return false;
        if(currentStep === steps.length - 1){
            return steps.every((_, index) => isStepCompleted(index));
        }
        return false;
    }

    // Safety check: ensure steps exist and currentStep is valid
    if(!steps || steps.length === 0 || !steps[currentStep]) {
        return (
            <div className={`shared-flow-manager ${className}`}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No steps available. Please configure the form.</p>
                </div>
            </div>
        );
    }

    const CurrentStepComponent = steps[currentStep].component;
    const canProceed = isStepCompleted(currentStep);
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className={`shared-flow-manager ${className}`}>
            {/* Close button for full-screen flows */}
            {onClose && className.includes('create-study-session-flow') && (
                <button 
                    className="flow-close-button"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✕
                </button>
            )}
            <div className="setup-container">
                {/* Left sidebar with steps */}
                <div className="steps-sidebar">
                    <div className="steps-header">
                        <div className="row">
                            {/* <Logo size={25} /> */}
                            {/* Error: won't let me use any of hte logos for some reason so leavin this as a place holder for now */}
                            <div className="testLogoTwo">(Z)</div>
                            <h1>{headerTitle}</h1>
                        </div>
                        <p>{headerSubtitle}</p>
                        
                    </div>
                    
                    <div className="steps-list">
                        {steps.map((step, index) => {
                            const isCompleted = isStepCompleted(index);
                            return (
                                <div 
                                    key={step.id}
                                    className={`step-item ${currentStep === index ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                    onClick={() => setCurrentStep(index)}
                                >
                                    <div className="step-number">
                                        {isCompleted ? (
                                            <div className="completed-icon">✓</div>
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <div className="step-content">
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main content area */}
                <div className="content-area">
                    {/* @james I think content header here is just cluter, same info is directly to the left and it reduces how much of the page the use can see by a deceant amount */}
                    {/* <div className="content-header">
                        <h2>{steps[currentStep].title}</h2>
                        <p>{steps[currentStep].description}</p>
                    </div> */}

                    <div className="step-content">
                        <CurrentStepComponent
                            formData={formData}
                            setFormData={setFormData}
                            onComplete={(isValid) => handleStepComplete(currentStep, isValid)}
                        />
                    </div>

                    <div className="navigation-buttons">
                        {currentStep > 0 && (
                            <button 
                                className="btn-secondary"
                                onClick={handlePrevious}
                                disabled={isSubmitting}
                            >
                                {backButtonText}
                            </button>
                        )}
                        
                        <div className="right-buttons">
                            {isLastStep ? (
                                <>
                                    <button 
                                        className={`btn-primary ${ !canSubmit() || isSubmitting ? 'disabled' : ''}`}
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? submittingButtonText : submitButtonText}
                                    </button>
                                    
                                    {/* Show missing fields popup */}
                                    <Popup isOpen={showMissingFields} onClose={() => setShowMissingFields(false)} defaultStyling={true}>
                                        <div style={{ padding: '2rem', minWidth: '400px' }}>
                                            <h3 style={{ marginTop: 0 }}>Missing Required Fields</h3>
                                            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                                                Please complete the following required fields before publishing:
                                            </p>
                                            {getMissingFields && formConfig ? (
                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    {(() => {
                                                        const missingFields = getMissingFields(formData, formConfig);
                                                        // Group by step
                                                        const groupedByStep = missingFields.reduce((acc, field) => {
                                                            if (!acc[field.stepTitle]) {
                                                                acc[field.stepTitle] = [];
                                                            }
                                                            acc[field.stepTitle].push(field);
                                                            return acc;
                                                        }, {});
                                                        
                                                        return Object.entries(groupedByStep).map(([stepTitle, fields]) => (
                                                            <div key={stepTitle} style={{ marginBottom: '1rem' }}>
                                                                <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
                                                                    {stepTitle}
                                                                </h4>
                                                                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                                    {fields.map((field, idx) => (
                                                                        <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                                                            {field.label}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            ) : (
                                                <p>Unable to determine missing fields.</p>
                                            )}
                                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => {
                                                        setShowMissingFields(false);
                                                        // Navigate to first incomplete step
                                                        if (getMissingFields && formConfig) {
                                                            const missingFields = getMissingFields(formData, formConfig);
                                                            if (missingFields.length > 0) {
                                                                const firstMissingStep = steps.findIndex(step => 
                                                                    step.stepId === missingFields[0].step
                                                                );
                                                                if (firstMissingStep !== -1) {
                                                                    setCurrentStep(firstMissingStep);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '0.5rem 1.5rem',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Go to First Missing Field
                                                </button>
                                                <button 
                                                    onClick={() => setShowMissingFields(false)}
                                                    style={{
                                                        padding: '0.5rem 1.5rem',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </>
                            ) : (
                                <button 
                                    className={`btn-primary ${!canProceed ? 'disabled' : ''}`}
                                    onClick={handleNext}
                                    disabled={!canProceed}
                                >
                                    {continueButtonText}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlowComponentV2;
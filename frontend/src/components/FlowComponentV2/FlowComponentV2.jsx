import React, { useState, useEffect } from 'react';
import './FlowComponentV2.scss';
import Logo from '../../assets/Brand Image/EventsLogo.svg';
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
    onError = null
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stepValidation, setStepValidation] = useState(new Array(steps.length).fill(false));

    // Initialize validation state based on existing form data
    useEffect(() => {
        const initialValidation = steps.map((step, index) => {
            // Check if step has required data
            switch(index) {
                case 0: // GenInfo
                    return !!(formData.name && formData.description && formData.type && formData.visibility && formData.expectedAttendance > 0);
                case 1: // When (room selection)
                    return !!formData.location;
                case 2: // Where (time selection)
                    return !!(formData.start_time && formData.end_time);
                case 3: // Review
                    return !!(formData.contact && formData.OIEAcknowledgementItems && formData.OIEAcknowledgementItems.length > 0);
                default:
                    return false;
            }
        });
        console.log('Initial validation state:', initialValidation);
        setStepValidation(initialValidation);
    }, [formData, steps.length]);

    // Function to check if a step is completed based on form data
    const isStepCompleted = (stepIndex) => {
        switch(stepIndex) {
            case 0: // GenInfo
                return !!(formData.name && formData.description && formData.type && formData.visibility && formData.expectedAttendance > 0);
            case 1: // When (room selection)
                return !!formData.location;
            case 2: // Where (time selection)
                return !!(formData.start_time && formData.end_time);
            case 3: // Review
                return !!(formData.contact && formData.OIEAcknowledgementItems && formData.OIEAcknowledgementItems.length > 0);
            default:
                return false;
        }
    };

    const handleStepComplete = (stepIndex, isValid) => {
        console.log(`Step ${stepIndex} validation:`, isValid);
        setStepValidation(prev => {
            const newValidation = [...prev];
            newValidation[stepIndex] = isValid;
            console.log('Updated validation state:', newValidation);
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
        if(currentStep === steps.length - 1){
            return steps.every((_, index) => isStepCompleted(index));
        }
        return false;
    }

    const CurrentStepComponent = steps[currentStep].component;
    const canProceed = isStepCompleted(currentStep);
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className={`shared-flow-manager ${className}`}>
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
                    <div className="content-header">
                        <h2>{steps[currentStep].title}</h2>
                        <p>{steps[currentStep].description}</p>
                    </div>

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
                                /* add validation check */
                                <button 
                                    className={`btn-primary ${ !canSubmit() || isSubmitting ? 'disabled' : ''}`}
                                    onClick={handleSubmit}
                                    disabled={!canSubmit() || isSubmitting}
                                >
                                    {isSubmitting ? submittingButtonText : submitButtonText}
                                </button>
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
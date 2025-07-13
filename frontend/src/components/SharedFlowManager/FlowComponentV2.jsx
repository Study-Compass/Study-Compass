import React, { useState } from 'react';
import './FlowComponentV2.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

const FlowComponentV2 = ({
    steps,
    formData,
    setFormData,
    onSubmit,
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
            return stepValidation.every(isValid => isValid);
        }
        return false;
    }

    const CurrentStepComponent = steps[currentStep].component;
    const canProceed = stepValidation[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className={`shared-flow-manager ${className}`}>
            <div className="setup-container">
                {/* Left sidebar with steps */}
                <div className="steps-sidebar">
                    <div className="steps-header">
                        <div className="row">
                            <h1>{headerTitle}</h1>
                        </div>
                        <p>{headerSubtitle}</p>
                    </div>
                    <div className="steps-list">
                        {steps.map((step, index) => (
                            <div 
                                key={step.id}
                                className={`step-item ${currentStep === index ? 'active' : ''} ${stepValidation[index] ? 'completed' : ''}`}
                                onClick={() => setCurrentStep(index)}
                            >
                                <div className="step-number">
                                    {stepValidation[index] ? (
                                        <Icon icon="line-md:circle-to-confirm-circle-twotone-transition" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <div className="step-content">
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Horizontal step tracker for mobile */}
                <div className="steps-horizontal-tracker">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`step-dot ${currentStep === index ? 'active' : ''} ${stepValidation[index] ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(index)}
                        >
                            <span className="dot-number">{index + 1}</span>
                            <span className="dot-title">{step.title}</span>
                        </div>
                    ))}
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
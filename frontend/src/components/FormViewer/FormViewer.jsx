import React, { useState } from 'react';
import './FormViewer.scss';
import './Question.scss'

const FormViewer = ({ form, onSubmit }) => {
  const [responses, setResponses] = useState({});

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required questions
    const missingRequired = form.questions.filter(q => 
      q.required && (!responses[q.id] || (Array.isArray(responses[q.id]) && responses[q.id].length === 0))
    );

    if (missingRequired.length > 0) {
      alert(`Please answer the following required questions: ${missingRequired.map(q => q.question).join(', ')}`);
      return;
    }

    onSubmit(responses);
  };

  const renderQuestion = (question) => {
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

  return (
    <div className="form-viewer">
      <div className="form-header">
        <h1>{form.title}</h1>
        {form.description && <p>{form.description}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        {form.questions.map((question) => (
          <div key={question.id} className="question-container">
            <div className="question-header">
              <h3>{question.question}</h3>
              {question.required && <span className="required">*</span>}
            </div>
            {renderQuestion(question)}
          </div>
        ))}

        <button type="submit" className="submit-button">Submit</button>
      </form>
    </div>
  );
};

export default FormViewer;


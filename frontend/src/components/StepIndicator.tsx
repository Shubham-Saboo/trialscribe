import React from 'react';
import { FaFileAlt, FaUser, FaFilter, FaList } from 'react-icons/fa';
import './StepIndicator.css';

export type Step = 'input' | 'patient' | 'search' | 'results';

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick?: (step: Step) => void;
}

interface StepConfig {
  id: Step;
  label: string;
  icon: React.ReactNode;
}

const steps: StepConfig[] = [
  { id: 'input', label: 'Input', icon: <FaFileAlt /> },
  { id: 'patient', label: 'Patient Info', icon: <FaUser /> },
  { id: 'search', label: 'Search', icon: <FaFilter /> },
  { id: 'results', label: 'Results', icon: <FaList /> },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  const getStepIndex = (step: Step): number => {
    return steps.findIndex(s => s.id === step);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;
        const isClickable = onStepClick && (isCompleted || isActive);

        return (
          <div key={step.id} className="step-indicator-container">
            <div
              className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && onStepClick?.(step.id)}
            >
              <div className="step-icon">{step.icon}</div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${index < currentIndex ? 'completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;


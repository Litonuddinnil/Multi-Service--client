import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  subLabel?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isAccessible = index <= currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {index > 0 && (
                <div 
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-200 ${
                    index <= currentStepIndex ? 'bg-[#34C759]' : 'bg-[#E5E7EB]'
                  }`} 
                />
              )}

              {/* Step node */}
              <div 
                className={`flex flex-col items-center group ${isAccessible ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => {
                  if (isAccessible && onStepClick) {
                    onStepClick(index);
                  }
                }}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-200 ${
                    isCompleted
                      ? 'bg-[#34C759] text-white border-[#34C759]'
                      : isCurrent
                      ? 'bg-white text-[#34C759] border-[#34C759] ring-4 ring-[#34C759]/10'
                      : 'bg-white text-gray-400 border-[#E5E7EB]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span 
                  className={`mt-2 text-xs text-center font-medium max-w-[90px] truncate ${
                    isCurrent ? 'text-[#111827] font-semibold' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                {step.subLabel && (
                  <span className="text-[10px] text-gray-400 text-center max-w-[80px] truncate">
                    {step.subLabel}
                  </span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

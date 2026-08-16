import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helpText,
  children,
  id,
  className = ''
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label 
        htmlFor={id} 
        className="text-xs font-semibold text-[#111827] flex items-center gap-1 select-none"
      >
        <span>{label}</span>
        {required && <span className="text-red-500 font-bold">*</span>}
      </label>
      
      {children}

      {error ? (
        <span className="text-xs text-red-600 flex items-center gap-1 font-medium mt-0.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </span>
      ) : helpText ? (
        <span className="text-xs text-[#6B7280] leading-normal">{helpText}</span>
      ) : null}
    </div>
  );
};

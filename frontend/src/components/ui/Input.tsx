import React, { InputHTMLAttributes, forwardRef } from 'react';
import { components, utils } from '../../styles/designSystem';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  hint,
  leftIcon,
  rightIcon,
  loading = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClasses = utils.cn(
    components.input.base,
    error && components.input.error,
    success && components.input.success,
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    loading && 'pr-10',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm" aria-hidden="true">
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
        {(rightIcon || loading) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <svg 
                className="w-4 h-4 text-gray-400 animate-spin" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : rightIcon && (
              <span className="text-gray-400 text-sm" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </div>
        )}
      </div>
      
      {hint && !error && !success && (
        <p className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      
      {success && (
        <p className="mt-1 text-sm text-success-600">
          {success}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  resize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  success,
  hint,
  resize = true,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const textareaClasses = utils.cn(
    components.input.base,
    error && components.input.error,
    success && components.input.success,
    !resize && 'resize-none',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        {...props}
      />
      
      {hint && !error && !success && (
        <p className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      
      {success && (
        <p className="mt-1 text-sm text-success-600">
          {success}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
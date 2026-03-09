import type { TextareaHTMLAttributes } from 'react';
import { CircleHelpIcon, WarningIcon } from '../../icons/Icons';
import './InputField.css';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helpText?: string;
  status?: 'default' | 'error' | 'warning';
  required?: boolean;
  showHelpIcon?: boolean;
}

export const TextArea = ({
  label,
  helpText,
  status = 'default',
  required = false,
  showHelpIcon = false,
  className = '',
  id,
  ...props
}: TextAreaProps) => {
  const fieldClasses = ['field', status !== 'default' ? `field--${status}` : '', className]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'input',
    'input--textarea',
    status !== 'default' ? `input--${status}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const textareaElement = (
    <textarea id={id} className={inputClasses} required={required} {...props} />
  );

  return (
    <div className={fieldClasses}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && <span className="field__label-required">*</span>}
          {showHelpIcon && (
            <span className="field__label-help">
              <CircleHelpIcon width={14} height={14} />
            </span>
          )}
        </label>
      )}
      {status === 'warning' ? (
        <div className="field__input-wrapper">
          {textareaElement}
          <WarningIcon className="field__warning-icon" />
        </div>
      ) : (
        textareaElement
      )}
      {helpText && <span className="field__help-text">{helpText}</span>}
    </div>
  );
};

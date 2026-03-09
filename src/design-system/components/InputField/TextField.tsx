import type { InputHTMLAttributes } from 'react';
import { CircleHelpIcon, WarningIcon } from '../../icons/Icons';
import './InputField.css';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  status?: 'default' | 'error' | 'warning';
  required?: boolean;
  showHelpIcon?: boolean;
}

export const TextField = ({
  label,
  helpText,
  status = 'default',
  required = false,
  showHelpIcon = false,
  className = '',
  id,
  ...props
}: TextFieldProps) => {
  const fieldClasses = ['field', status !== 'default' ? `field--${status}` : '', className]
    .filter(Boolean)
    .join(' ');

  const inputClasses = ['input', status !== 'default' ? `input--${status}` : '']
    .filter(Boolean)
    .join(' ');

  const inputElement = (
    <input id={id} type="text" className={inputClasses} required={required} {...props} />
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
          {inputElement}
          <WarningIcon className="field__warning-icon" />
        </div>
      ) : (
        inputElement
      )}
      {helpText && <span className="field__help-text">{helpText}</span>}
    </div>
  );
};

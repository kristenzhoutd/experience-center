import type { SelectHTMLAttributes } from 'react';
import { CaretDownIcon, CircleHelpIcon, WarningIcon } from '../../icons/Icons';
import './InputField.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helpText?: string;
  status?: 'default' | 'error' | 'warning';
  required?: boolean;
  showHelpIcon?: boolean;
}

export const Select = ({
  label,
  helpText,
  status = 'default',
  required = false,
  showHelpIcon = false,
  className = '',
  id,
  children,
  ...props
}: SelectProps) => {
  const fieldClasses = ['field', status !== 'default' ? `field--${status}` : '', className]
    .filter(Boolean)
    .join(' ');

  const inputClasses = ['input', status !== 'default' ? `input--${status}` : '']
    .filter(Boolean)
    .join(' ');

  const selectElement = (
    <div className="select-wrapper">
      <select id={id} className={inputClasses} required={required} {...props}>
        {children}
      </select>
      <CaretDownIcon className="select__icon" />
    </div>
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
          {selectElement}
          <WarningIcon className="field__warning-icon" />
        </div>
      ) : (
        selectElement
      )}
      {helpText && <span className="field__help-text">{helpText}</span>}
    </div>
  );
};

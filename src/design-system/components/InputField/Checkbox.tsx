import type { InputHTMLAttributes } from 'react';
import './InputField.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  status?: 'default' | 'error';
  readOnly?: boolean;
}

export const Checkbox = ({
  label,
  status = 'default',
  readOnly = false,
  className = '',
  id,
  ...props
}: CheckboxProps) => {
  const wrapperClasses = [
    'checkbox',
    status !== 'default' ? `checkbox--${status}` : '',
    readOnly ? 'checkbox--readonly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={wrapperClasses}>
      <input
        id={id}
        type="checkbox"
        className="checkbox__input"
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        {...props}
      />
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  );
};

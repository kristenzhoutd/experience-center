import type { InputHTMLAttributes } from 'react';
import './InputField.css';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Toggle = ({
  label,
  className = '',
  id,
  ...props
}: ToggleProps) => {
  const wrapperClasses = ['toggle', className].filter(Boolean).join(' ');

  return (
    <label className={wrapperClasses}>
      <input id={id} type="checkbox" className="toggle__input" {...props} />
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
};

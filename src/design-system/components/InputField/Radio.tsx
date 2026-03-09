import type { InputHTMLAttributes } from 'react';
import './InputField.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Radio = ({
  label,
  className = '',
  id,
  ...props
}: RadioProps) => {
  const wrapperClasses = ['radio', className].filter(Boolean).join(' ');

  return (
    <label className={wrapperClasses}>
      <input id={id} type="radio" className="radio__input" {...props} />
      {label && <span className="radio__label">{label}</span>}
    </label>
  );
};

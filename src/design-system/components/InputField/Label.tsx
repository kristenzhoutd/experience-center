import type { LabelHTMLAttributes } from 'react';
import { CircleHelpIcon } from '../../icons/Icons';
import './InputField.css';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** The label text */
  children: string;
  /** Shows required asterisk */
  required?: boolean;
  /** Shows a help icon next to the label */
  showHelpIcon?: boolean;
}

export const Label = ({
  children,
  required = false,
  showHelpIcon = false,
  className = '',
  ...props
}: LabelProps) => {
  const labelClasses = ['field__label', className].filter(Boolean).join(' ');

  return (
    <label className={labelClasses} {...props}>
      {children}
      {required && <span className="field__label-required">*</span>}
      {showHelpIcon && (
        <span className="field__label-help">
          <CircleHelpIcon width={12} height={12} />
        </span>
      )}
    </label>
  );
};

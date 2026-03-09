import './InputField.css';

export interface HelptextProps {
  /** The help text content */
  children: string;
  /** Visual variant */
  type?: 'default' | 'success' | 'error';
  className?: string;
}

export const Helptext = ({
  children,
  type = 'default',
  className = '',
}: HelptextProps) => {
  const wrapperClasses = [
    'field',
    type !== 'default' ? `field--${type}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <span className="field__help-text">{children}</span>
    </div>
  );
};

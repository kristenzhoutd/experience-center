import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'md' | 'sm' | 'xs';
  icon?: ReactNode;
  iconOnly?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconOnly = false,
  disabled = false,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    iconOnly ? 'button--icon-only' : '',
    disabled ? 'button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="button__icon">{icon}</span>}
      {!iconOnly && children}
    </button>
  );
};

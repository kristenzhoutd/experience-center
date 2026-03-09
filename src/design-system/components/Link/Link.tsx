import type { AnchorHTMLAttributes } from 'react';
import './Link.css';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const Link = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}: LinkProps) => {
  const classes = [
    'link',
    `link--${variant}`,
    `link--${size}`,
    disabled ? 'link--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      className={classes}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      {...props}
    >
      {children}
    </a>
  );
};

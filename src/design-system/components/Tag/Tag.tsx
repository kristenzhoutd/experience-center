import type { HTMLAttributes, ReactNode } from 'react';
import './Tag.css';

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary' | 'purple' | 'teal';
  size?: 'default' | 'mini';
  icon?: ReactNode;
  onClose?: () => void;
  children: string;
}

export const Tag = ({
  variant = 'neutral',
  size = 'default',
  icon,
  onClose,
  className = '',
  children,
  ...props
}: TagProps) => {
  const classes = ['tag', `tag--${variant}`, `tag--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {icon && <span className="tag__icon">{icon}</span>}
      {children}
      {onClose && (
        <button
          type="button"
          className="tag__close"
          onClick={onClose}
          aria-label={`Remove ${children}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

import type { ReactNode } from 'react';
import './Tooltip.css';

export type TooltipPosition =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface TooltipProps {
  /** Content inside the tooltip */
  children: ReactNode;
  /** Arrow position relative to the tooltip body */
  position?: TooltipPosition;
  /** Additional CSS class */
  className?: string;
}

export interface TooltipTextProps {
  children: string;
}

export interface TooltipBulletListProps {
  items: string[];
}

export interface TooltipIconListProps {
  items: string[];
}

/**
 * Plain text content for a Tooltip.
 */
export const TooltipText = ({ children }: TooltipTextProps) => (
  <div className="tooltip-content">
    <p className="tooltip-content__text">{children}</p>
  </div>
);

/**
 * Bulleted list content for a Tooltip.
 */
export const TooltipBulletList = ({ items }: TooltipBulletListProps) => (
  <div className="tooltip-content">
    <ul className="tooltip-content__bullets">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  </div>
);

/**
 * Icon list (checkmarks) content for a Tooltip.
 */
export const TooltipIconList = ({ items }: TooltipIconListProps) => (
  <div className="tooltip-content tooltip-content--icon-list">
    {items.map((item, i) => (
      <div key={i} className="tooltip-content__icon-row">
        <svg
          className="tooltip-content__check-icon"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M4 9L7.5 12.5L14 5.5"
            stroke="var(--success-6, #11B076)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="tooltip-content__text">{item}</span>
      </div>
    ))}
  </div>
);

function getArrowEdge(position: TooltipPosition): 'top' | 'bottom' | 'left' | 'right' {
  if (position.startsWith('top')) return 'top';
  if (position.startsWith('bottom')) return 'bottom';
  if (position.startsWith('left')) return 'left';
  return 'right';
}

/**
 * Tooltip component matching the Diamond Design System spec.
 *
 * Supports 12 arrow positions and 3 content types
 * (use TooltipText, TooltipBulletList, or TooltipIconList as children).
 */
export const Tooltip = ({
  children,
  position = 'top',
  className = '',
}: TooltipProps) => {
  const edge = getArrowEdge(position);

  const classes = [
    'tooltip',
    `tooltip--arrow-${edge}`,
    `tooltip--${position}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="tooltip__arrow" />
      <div className="tooltip__body">{children}</div>
    </div>
  );
};

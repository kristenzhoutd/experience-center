import type { HTMLAttributes, ReactNode } from 'react';
import './Tabs.css';

export interface TabItem {
  /** Unique key for the tab */
  key: string;
  /** Tab label text */
  label: string;
  /** Optional icon before the label (16×16) */
  icon?: ReactNode;
  /** Optional icon after the label (16×16) */
  iconAfter?: ReactNode;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Tab variant */
  variant?: 'primary' | 'secondary';
  /** Array of tab items */
  items: TabItem[];
  /** Key of the currently selected tab */
  value: string;
  /** Callback when a tab is selected */
  onChange: (key: string) => void;
}

export const Tabs = ({
  variant = 'primary',
  items,
  value,
  onChange,
  className = '',
  ...props
}: TabsProps) => {
  const classes = ['tabs', `tabs--${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="tablist" {...props}>
      {items.map((item) => {
        const isSelected = item.key === value;
        const tabClasses = [
          'tabs__tab',
          isSelected && 'tabs__tab--selected',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            className={tabClasses}
            aria-selected={isSelected}
            onClick={() => onChange(item.key)}
          >
            {item.icon && <span className="tabs__icon">{item.icon}</span>}
            <span className="tabs__label">{item.label}</span>
            {item.iconAfter && <span className="tabs__icon">{item.iconAfter}</span>}
          </button>
        );
      })}
      {variant === 'secondary' && <div className="tabs__spacer" />}
    </div>
  );
};

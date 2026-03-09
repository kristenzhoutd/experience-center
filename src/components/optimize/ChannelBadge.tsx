// Channel brand colors
const CHANNEL_COLORS: Record<string, { bg: string; text: string }> = {
  Meta: { bg: '#1877F2', text: '#FFFFFF' },
  Google: { bg: '#4285F4', text: '#FFFFFF' },
  TikTok: { bg: '#000000', text: '#FFFFFF' },
  LinkedIn: { bg: '#0A66C2', text: '#FFFFFF' },
  Twitter: { bg: '#000000', text: '#FFFFFF' },
  'Twitter/X': { bg: '#000000', text: '#FFFFFF' },
  X: { bg: '#000000', text: '#FFFFFF' },
  Pinterest: { bg: '#E60023', text: '#FFFFFF' },
  Snapchat: { bg: '#FFFC00', text: '#000000' },
};

const DEFAULT_COLORS = { bg: '#6B7280', text: '#FFFFFF' };

interface ChannelBadgeProps {
  channel: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function ChannelBadge({
  channel,
  size = 'sm',
  showLabel = false,
}: ChannelBadgeProps) {
  const colors = CHANNEL_COLORS[channel] || DEFAULT_COLORS;

  const sizeStyles = {
    sm: {
      container: showLabel
        ? 'px-1.5 py-0.5 gap-1'
        : 'w-5 h-5',
      iconSize: 'text-[10px]',
      fontSize: 'text-[9px]',
    },
    md: {
      container: showLabel
        ? 'px-2.5 py-1 gap-1.5'
        : 'w-6 h-6',
      iconSize: 'text-xs',
      fontSize: 'text-[11px]',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={`inline-flex items-center justify-center ${styles.container} rounded flex-shrink-0 transition-transform duration-150 hover:scale-105 hover:shadow-md cursor-default`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
      title={channel}
    >
      <span className={`${styles.iconSize} font-semibold leading-none`}>
        {channel[0]}
      </span>
      {showLabel && (
        <span className={`${styles.fontSize} font-medium whitespace-nowrap`}>
          {channel}
        </span>
      )}
    </div>
  );
}

export { CHANNEL_COLORS };

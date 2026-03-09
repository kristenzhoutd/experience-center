import type { Meta, StoryObj } from '@storybook/react-vite';

const tokenGroups = {
  Surface: [
    { name: '--surface-default', value: '#ffffff', alias: 'neutral-0' },
    { name: '--surface-button-primary', value: '#020713', alias: 'neutral-11' },
    { name: '--surface-button-hover', value: '#353942', alias: 'neutral-9' },
    { name: '--surface-disabled', value: '#f2f3f3', alias: 'neutral-1' },
    { name: '--surface-warning', value: '#fffcf6', alias: 'warning-0' },
    { name: '--surface-error', value: '#fef6f6', alias: 'error-0' },
    { name: '--surface-checkbox', value: '#020713', alias: 'neutral-11' },
    { name: '--surface-radio', value: '#020713', alias: 'neutral-11' },
    { name: '--surface-radio-disabled', value: '#9a9ca1', alias: 'neutral-5' },
    { name: '--surface-tab-selected', value: '#f2f3f3', alias: 'neutral-1' },
    { name: '--surface-tag-success', value: '#cfefe4', alias: 'success-2' },
    { name: '--surface-tag-warning', value: '#fee5b7', alias: 'warning-3' },
    { name: '--surface-tag-error', value: '#ffffff', alias: 'neutral-0' },
    { name: '--surface-tag-neutral', value: '#ffffff', alias: 'neutral-0' },
    { name: '--surface-tag-primary', value: '#ffffff', alias: 'neutral-0' },
    { name: '--surface-tag-purple', value: '#ffffff', alias: 'neutral-0' },
    { name: '--surface-tag-teal', value: '#ffffff', alias: 'neutral-0' },
    { name: '--surface-toggle-off', value: '#e6e6e7', alias: 'neutral-2' },
    { name: '--surface-toggle-disabled', value: '#9a9ca1', alias: 'neutral-5' },
    { name: '--surface-toggle-on', value: '#020713', alias: 'neutral-11' },
    { name: '--surface-message-info', value: '#f2f5fe', alias: 'primary-0' },
    { name: '--surface-message-success', value: '#e7f7f1', alias: 'success-1' },
    { name: '--surface-message-warning', value: '#fef2db', alias: 'warning-2' },
    { name: '--surface-message-error', value: '#fdecec', alias: 'error-1' },
  ],
  Border: [
    { name: '--border-default', value: '#e6e6e7', alias: 'neutral-2' },
    { name: '--border-inverse', value: '#ffffff', alias: 'neutral-0' },
    { name: '--border-disabled', value: '#cccdd0', alias: 'neutral-3' },
    { name: '--border-error', value: '#f26969', alias: 'error-5' },
    { name: '--border-warning', value: '#fcbf4c', alias: 'warning-6' },
    { name: '--border-strong', value: '#b3b5b8', alias: 'neutral-4' },
    { name: '--border-focus', value: 'rgba(54,97,232,0.4)', alias: 'primary-5 @ 40%' },
    { name: '--border-radio-checked', value: '#020713', alias: 'neutral-11' },
    { name: '--border-radio-checked-disabled', value: '#b3b5b8', alias: 'neutral-4' },
    { name: '--border-radio-unchecked', value: '#cccdd0', alias: 'neutral-3' },
    { name: '--border-tab-selected', value: '#020713', alias: 'neutral-11' },
  ],
  Text: [
    { name: '--text-default', value: '#020713', alias: 'neutral-11' },
    { name: '--text-secondary', value: '#676a71', alias: 'neutral-7' },
    { name: '--text-inverse', value: '#ffffff', alias: 'neutral-0' },
    { name: '--text-placeholder', value: '#9a9ca1', alias: 'neutral-5' },
    { name: '--text-subtext', value: '#808389', alias: 'neutral-6' },
    { name: '--text-disabled', value: '#9a9ca1', alias: 'neutral-5' },
    { name: '--text-text-link', value: '#0439e2', alias: 'primary-6' },
    { name: '--text-success', value: '#11b076', alias: 'success-6' },
    { name: '--text-tag-success', value: '#07462f', alias: 'success-9' },
    { name: '--text-tag-warning', value: '#654c1e', alias: 'warning-9' },
    { name: '--text-error', value: '#bf3636', alias: 'error-7' },
    { name: '--text-tag-text', value: '#353942', alias: 'neutral-9' },
    { name: '--text-tag-primary', value: '#032eb5', alias: 'primary-7' },
    { name: '--text-tag-purple', value: '#7a0dc8', alias: '' },
    { name: '--text-tag-teal', value: '#0592aa', alias: '' },
  ],
  Icon: [
    { name: '--icon-default', value: '#020713', alias: 'neutral-11' },
    { name: '--icon-secondary', value: '#b3b5b8', alias: 'neutral-4' },
    { name: '--icon-inverse', value: '#ffffff', alias: 'neutral-0' },
    { name: '--icon-warning', value: '#ca993d', alias: 'warning-7' },
    { name: '--icon-error', value: '#ef4444', alias: 'error-6' },
    { name: '--icon-tag-success', value: '#07462f', alias: 'success-9' },
    { name: '--icon-tag-warning', value: '#654c1e', alias: 'warning-9' },
    { name: '--icon-tag', value: '#353942', alias: 'neutral-9' },
    { name: '--icon-tag-primary', value: '#032eb5', alias: 'primary-7' },
    { name: '--icon-tag-purple', value: '#7a0dc8', alias: '' },
    { name: '--icon-tag-teal', value: '#0592aa', alias: '' },
  ],
};

const isDark = (hex: string) => {
  if (hex.startsWith('rgba')) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

const swatchStyle = (value: string): React.CSSProperties => ({
  width: 40,
  height: 40,
  borderRadius: 6,
  backgroundColor: value,
  border: '1px solid #e6e6e7',
  flexShrink: 0,
});

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '6px 0',
};

const nameStyle: React.CSSProperties = {
  fontFamily: "'Manrope', monospace",
  fontSize: 13,
  fontWeight: 500,
  color: '#020713',
  minWidth: 260,
};

const valueStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 12,
  color: '#676a71',
  minWidth: 160,
};

const aliasStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#9a9ca1',
};

const headingStyle: React.CSSProperties = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: 18,
  fontWeight: 600,
  color: '#020713',
  marginTop: 32,
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #e6e6e7',
};

const TokenGroup = ({ title, tokens }: { title: string; tokens: typeof tokenGroups.Surface }) => (
  <div>
    <h3 style={headingStyle}>{title}</h3>
    {tokens.map((t) => (
      <div key={t.name} style={rowStyle}>
        <div style={swatchStyle(t.value)}>
          {t.name.includes('border') && (
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 5,
                border: `3px solid ${t.value}`,
                boxSizing: 'border-box',
                backgroundColor: 'white',
              }}
            />
          )}
          {(t.name.includes('text-') || t.name.includes('icon-')) && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: t.value,
                backgroundColor: isDark(t.value) ? '#ffffff' : '#f2f3f3',
                borderRadius: 5,
              }}
            >
              Aa
            </div>
          )}
        </div>
        <span style={nameStyle}>{t.name}</span>
        <span style={valueStyle}>{t.value}</span>
        {t.alias && <span style={aliasStyle}>{t.alias}</span>}
      </div>
    ))}
  </div>
);

const SemanticTokens = () => (
  <div style={{ padding: 24, maxWidth: 720, fontFamily: "'Manrope', sans-serif" }}>
    <h2
      style={{
        fontSize: 24,
        fontWeight: 700,
        color: '#020713',
        marginBottom: 4,
      }}
    >
      Semantic Tokens
    </h2>
    <p style={{ fontSize: 14, color: '#808389', marginBottom: 16 }}>
      {Object.values(tokenGroups).reduce((sum, g) => sum + g.length, 0)} tokens across{' '}
      {Object.keys(tokenGroups).length} categories. These reference primitive color tokens and
      encode design intent for consistent usage.
    </p>
    {Object.entries(tokenGroups).map(([title, tokens]) => (
      <TokenGroup key={title} title={title} tokens={tokens} />
    ))}
  </div>
);

const meta = {
  title: 'Tokens/Semantic',
  component: SemanticTokens,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SemanticTokens>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTokens: Story = {};

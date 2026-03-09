/**
 * BlockPalette — horizontal bar of draggable content blocks.
 *
 * Uses GrapesJS BlockManager to render blocks as drag sources.
 * Displayed below the canvas in the editor layout.
 * Blocks are organized into Layout and Content categories.
 */

import { BlocksProvider } from '@grapesjs/react';
import type { BlocksResultProps } from '@grapesjs/react';

const LAYOUT_BLOCK_IDS = [
  'ps-columns-2',
  'ps-columns-3',
  'ps-sidebar',
  'ps-divider',
  'ps-spacer',
] as const;

const CONTENT_BLOCK_IDS = [
  'ps-image',
  'ps-headline',
  'ps-body',
  'ps-cta',
] as const;

const BLOCK_META: Record<string, { label: string; description: string }> = {
  // Layout
  'ps-columns-2': { label: '2 Columns', description: 'Two-column layout' },
  'ps-columns-3': { label: '3 Columns', description: 'Three-column layout' },
  'ps-sidebar': { label: 'Sidebar', description: 'Sidebar + content layout (1/3 + 2/3)' },
  'ps-divider': { label: 'Divider', description: 'Horizontal divider line' },
  'ps-spacer': { label: 'Spacer', description: 'Vertical spacing element' },
  // Content
  'ps-image': { label: 'Image', description: 'Hero or product image' },
  'ps-headline': { label: 'Headline', description: 'Main heading text' },
  'ps-body': { label: 'Body Text', description: 'Paragraph copy' },
  'ps-cta': { label: 'CTA Button', description: 'Call-to-action link' },
};

function BlockItem({ id, blocks, dragStart, dragStop }: {
  id: string;
  blocks: BlocksResultProps['blocks'];
  dragStart: BlocksResultProps['dragStart'];
  dragStop: BlocksResultProps['dragStop'];
}) {
  const meta = BLOCK_META[id];
  const block = blocks.find((b) => b.getId() === id);
  if (!block || !meta) return null;
  return (
    <div
      draggable
      onDragStart={(e) => dragStart(block, e.nativeEvent)}
      onDragEnd={() => dragStop()}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-sm transition-all select-none"
      title={meta.description}
    >
      <BlockIcon id={id} />
      <span className="text-[11px] font-medium text-gray-700">{meta.label}</span>
    </div>
  );
}

export default function BlockPalette() {
  return (
    <BlocksProvider>
      {({ blocks, dragStart, dragStop }: BlocksResultProps) => (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200 overflow-x-auto">
          {/* Content group */}
          <span className="text-[10px] text-gray-400 uppercase tracking-wider mr-0.5 flex-shrink-0">Content</span>
          {CONTENT_BLOCK_IDS.map((id) => (
            <BlockItem key={id} id={id} blocks={blocks} dragStart={dragStart} dragStop={dragStop} />
          ))}
        </div>
      )}
    </BlocksProvider>
  );
}

function BlockIcon({ id }: { id: string }) {
  const cls = "w-4 h-4 text-gray-400";
  switch (id) {
    case 'ps-image':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'ps-headline':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M4 6h16M4 12h10" />
        </svg>
      );
    case 'ps-body':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M4 6h16M4 10h16M4 14h12M4 18h8" />
        </svg>
      );
    case 'ps-cta':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="3" y="8" width="18" height="8" rx="4" />
          <path d="M8 12h8" />
        </svg>
      );
    case 'ps-divider':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M3 12h18" />
        </svg>
      );
    case 'ps-spacer':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M12 5v14M5 8l7-3 7 3M5 16l7 3 7-3" />
        </svg>
      );
    case 'ps-columns-2':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="2" y="4" width="9" height="16" rx="1" />
          <rect x="13" y="4" width="9" height="16" rx="1" />
        </svg>
      );
    case 'ps-columns-3':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="1" y="4" width="6" height="16" rx="1" />
          <rect x="9" y="4" width="6" height="16" rx="1" />
          <rect x="17" y="4" width="6" height="16" rx="1" />
        </svg>
      );
    case 'ps-sidebar':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="2" y="4" width="6" height="16" rx="1" />
          <rect x="10" y="4" width="12" height="16" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

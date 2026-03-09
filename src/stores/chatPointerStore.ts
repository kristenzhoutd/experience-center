import { create } from 'zustand';
import type { ElementReference } from '../types/elementReference';

interface ChatPointerState {
  /** Whether the user is in "click-to-reference" selection mode */
  isSelectionMode: boolean;
  /** Currently selected element references */
  references: ElementReference[];

  toggleSelectionMode: () => void;
  exitSelectionMode: () => void;
  addReference: (ref: ElementReference) => void;
  removeReference: (id: string) => void;
  clearReferences: () => void;
  /** Build XML string to prepend to the user's chat message */
  getInjectionXml: () => string;
}

export const useChatPointerStore = create<ChatPointerState>((set, get) => ({
  isSelectionMode: false,
  references: [],

  toggleSelectionMode: () =>
    set((s) => ({ isSelectionMode: !s.isSelectionMode })),

  exitSelectionMode: () =>
    set((s) => (s.isSelectionMode ? { isSelectionMode: false } : s)),

  addReference: (ref) =>
    set((s) => {
      // Don't add duplicates
      if (s.references.some((r) => r.id === ref.id)) return s;
      return { references: [...s.references, ref] };
    }),

  removeReference: (id) =>
    set((s) => ({ references: s.references.filter((r) => r.id !== id) })),

  clearReferences: () => set({ references: [], isSelectionMode: false }),

  getInjectionXml: () => {
    const { references } = get();
    if (references.length === 0) return '';

    const entries = references
      .map((ref) => {
        const attrs = [
          `id="${ref.id}"`,
          `type="${ref.type}"`,
          `label="${ref.label}"`,
          `path="${ref.path.join(' > ')}"`,
        ];
        if (ref.currentValue !== undefined) {
          attrs.push(`currentValue="${ref.currentValue}"`);
        }
        attrs.push(`domain="${ref.context.domain}"`);
        if ('sectionKey' in ref.context) {
          attrs.push(`sectionKey="${ref.context.sectionKey}"`);
        }
        if ('pageId' in ref.context && ref.context.pageId) {
          attrs.push(`pageId="${ref.context.pageId}"`);
        }
        if ('spotId' in ref.context && ref.context.spotId) {
          attrs.push(`spotId="${ref.context.spotId}"`);
        }
        return `  <ref ${attrs.join(' ')} />`;
      })
      .join('\n');

    return `<element-references>\n${entries}\n</element-references>\n\n`;
  },
}));

/** Types for the Chat Pointer feature — lets users click UI elements to create explicit references for the AI agent. */

export type ElementReferenceType =
  | 'text-field'
  | 'select-field'
  | 'date-field'
  | 'tag-list'
  | 'segment'
  | 'spot'
  | 'variant'
  | 'image'
  | 'section'
  | 'page';

export type ElementReferenceContext =
  | { domain: 'campaign-setup' }
  | { domain: 'audiences' }
  | { domain: 'content'; pageId?: string; spotId?: string }
  | { domain: 'review' }
  | { domain: 'brief-editor'; sectionKey: string };

export interface ElementReference {
  /** Unique identifier for this reference (e.g. "setup.name", "seg-123") */
  id: string;
  /** The kind of UI element being referenced */
  type: ElementReferenceType;
  /** Breadcrumb path displayed in the banner (e.g. ["Campaign Setup", "Campaign Name"]) */
  path: string[];
  /** Human-readable label for the element */
  label: string;
  /** The element's current value, if applicable */
  currentValue?: string;
  /** Domain-specific context passed to the AI agent */
  context: ElementReferenceContext;
}

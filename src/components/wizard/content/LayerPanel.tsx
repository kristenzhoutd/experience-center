/**
 * LayerPanel — custom layer panel for visualizing, selecting, and reordering
 * GrapesJS components. Renders as a right sidebar alongside the canvas.
 *
 * Listens to GrapesJS component events to stay in sync with the canvas.
 */

import { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import type { Editor, Component as GjsComponent } from 'grapesjs';

// ── Helpers ────────────────────────────────────────────────────────────

/** Recursively find a component by ID in the tree */
function findComponentById(root: GjsComponent, id: string): GjsComponent | undefined {
  if (root.getId() === id) return root;
  for (const child of root.components().models) {
    const found = findComponentById(child, id);
    if (found) return found;
  }
  return undefined;
}

/** Get a display icon type based on component type */
function getTypeIcon(component: GjsComponent): 'image' | 'text' | 'link' | 'layer-group' | 'generic' {
  const type = component.get('type') || '';
  const tagName = (component.get('tagName') || '').toLowerCase();

  if (type === 'ps-layer-group') return 'layer-group';
  if (type === 'image') return 'image';
  if (type === 'link' || tagName === 'a') return 'link';
  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'p' || tagName === 'span') return 'text';
  if (type === 'text' || type === 'textnode') return 'text';
  return 'generic';
}

// ── LayerItem ──────────────────────────────────────────────────────────

interface LayerItemProps {
  component: GjsComponent;
  editor: Editor;
  depth: number;
}

function LayerItem({ component, editor, depth }: LayerItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [dragOver, setDragOver] = useState<'top' | 'bottom' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const children = component.components().models;
  const hasChildren = children.length > 0;
  const layerData = editor.Layers.getLayerData(component);
  const isSelected = layerData.selected;
  const isVisible = layerData.visible !== false;
  const name = component.getName() || component.get('type') || component.get('tagName') || 'Component';
  const typeIcon = getTypeIcon(component);

  const handleSelect = useCallback(() => {
    editor.select(component);
  }, [editor, component]);

  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    editor.Layers.setVisible(component, !isVisible);
  }, [editor, component, isVisible]);

  const handleDoubleClick = useCallback(() => {
    setEditName(name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [name]);

  const handleNameSubmit = useCallback(() => {
    if (editName.trim()) {
      component.set('custom-name', editName.trim());
    }
    setEditing(false);
  }, [component, editName]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit();
    if (e.key === 'Escape') setEditing(false);
  }, [handleNameSubmit]);

  // ── Drag-to-reorder ────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', component.getId());
    e.dataTransfer.effectAllowed = 'move';
  }, [component]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOver(e.clientY < midY ? 'top' : 'bottom');
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === component.getId()) return;

    const wrapper = editor.getWrapper();
    if (!wrapper) return;
    const dragged = findComponentById(wrapper, draggedId);
    if (!dragged) return;

    const targetParent = component.parent();
    if (!targetParent) return;

    const draggedParent = dragged.parent();
    const siblings = targetParent.components();
    const targetIndex = siblings.indexOf(component);
    if (targetIndex < 0) return;

    // Compute the correct insertion index accounting for same-parent removal
    const sameParent = draggedParent && draggedParent.getId() === targetParent.getId();
    const draggedIndex = sameParent ? siblings.indexOf(dragged) : -1;

    // Remove from current position
    dragged.remove();

    // Calculate insert position — if dragged was before target in same parent,
    // the target index shifts down by 1 after removal
    let insertAt = dragOver === 'bottom' ? targetIndex + 1 : targetIndex;
    if (sameParent && draggedIndex >= 0 && draggedIndex < targetIndex) {
      insertAt -= 1;
    }

    targetParent.append(dragged, { at: insertAt });
    editor.select(dragged);
  }, [editor, component, dragOver]);

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleSelect}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer select-none transition-colors text-[11px] ${
          isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
        } ${!isVisible ? 'opacity-40' : ''}`}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          borderTop: dragOver === 'top' ? '2px solid #6366f1' : '2px solid transparent',
          borderBottom: dragOver === 'bottom' ? '2px solid #6366f1' : '2px solid transparent',
        }}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 ${hasChildren ? 'text-gray-400' : 'invisible'}`}
        >
          <svg
            className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Type icon */}
        <TypeIcon type={typeIcon} />

        {/* Name (inline editable) */}
        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            className="flex-1 min-w-0 px-1 py-0 text-[11px] border border-indigo-300 rounded outline-none bg-white"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 min-w-0 truncate"
            onDoubleClick={handleDoubleClick}
          >
            {name}
          </span>
        )}

        {/* Visibility toggle */}
        <button
          onClick={handleToggleVisibility}
          className="p-0.5 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title={isVisible ? 'Hide' : 'Show'}
        >
          {isVisible ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          )}
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <LayerItem
              key={child.getId()}
              component={child}
              editor={editor}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Type icons ─────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: 'image' | 'text' | 'link' | 'layer-group' | 'generic' }) {
  const cls = 'w-3 h-3 flex-shrink-0 text-gray-400';
  switch (type) {
    case 'image':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'text':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M4 6h16M4 12h10" />
        </svg>
      );
    case 'link':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      );
    case 'layer-group':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
}

// ── LayerPanel ─────────────────────────────────────────────────────────

interface LayerPanelProps {
  editor: Editor;
}

export default function LayerPanel({ editor }: LayerPanelProps) {
  // Force re-render whenever the GrapesJS component tree changes
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const events = [
      'component:add',
      'component:remove',
      'component:drag:end',
      'component:selected',
      'component:deselected',
      'component:update',
      'layer:visual',
    ];

    for (const event of events) {
      editor.on(event, forceUpdate);
    }

    return () => {
      for (const event of events) {
        editor.off(event, forceUpdate);
      }
    };
  }, [editor]);

  const wrapper = editor.getWrapper();
  const children = wrapper ? wrapper.components().models : [];

  return (
    <div className="w-56 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Layers</span>
      </div>
      <div className="py-1">
        {children.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px] text-gray-400">
            No layers yet. Drag blocks onto the canvas.
          </div>
        ) : (
          children.map((child) => (
            <LayerItem
              key={child.getId()}
              component={child}
              editor={editor}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
}

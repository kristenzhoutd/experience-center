/**
 * GrapesJS Canvas — wraps @grapesjs/react with custom content blocks.
 *
 * Provides a visual WYSIWYG canvas for editing variant content.
 * Custom blocks (Image, Headline, Body, CTA) map back to VariantContent fields.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import GjsEditor, { Canvas } from '@grapesjs/react';
import type { Editor, ProjectData } from 'grapesjs';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import './grapesjs-light-theme.css';
import type { VariantContent } from '../../../types/campaignConfig';
import BlockPalette from './BlockPalette';
import AssetPickerModal, { loadAssetLibrary } from './AssetPickerModal';
import LayerPanel from './LayerPanel';
import StylePanel from './StylePanel';

// ── Helpers ──────────────────────────────────────────────────────────

/** Convert flat VariantContent fields into simple HTML for GrapesJS */
export function flatFieldsToGjsHtml(content: VariantContent): string {
  let html = '';
  if (content.imageUrl) {
    html += `<img src="${content.imageUrl}" alt="Hero image" class="ps-image" />`;
  }
  if (content.headline) {
    html += `<h2 class="ps-headline">${content.headline}</h2>`;
  }
  if (content.body) {
    html += `<p class="ps-body">${content.body}</p>`;
  }
  if (content.ctaText) {
    const href = content.deepLinkUrl || '#';
    html += `<a href="${href}" class="ps-cta">${content.ctaText}</a>`;
  }
  return html;
}

/** Responsive CSS injected into the GrapesJS canvas and available for deployed content */
export const RESPONSIVE_BASE_CSS = `
  body { font-family: Inter, system-ui, sans-serif; padding: 24px; margin: 0; }
  * { box-sizing: border-box; }

  /* ── Block base styles (Desktop) ─────────────────────────────── */

  .ps-image {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto 16px;
  }

  .ps-headline {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: #111;
  }

  .ps-body {
    margin: 0 0 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #444;
  }

  .ps-cta {
    display: inline-block;
    padding: 10px 24px;
    background: #6366f1;
    color: #fff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
  }

  /* ── Tablet (≤ 768px) ────────────────────────────────────────── */

  @media (max-width: 768px) {
    body { padding: 16px; }

    .ps-headline {
      font-size: 20px;
    }

    .ps-body {
      font-size: 13px;
    }

    .ps-cta {
      padding: 10px 20px;
      font-size: 13px;
    }
  }

  /* ── Mobile (≤ 480px) ────────────────────────────────────────── */

  @media (max-width: 480px) {
    body { padding: 12px; }

    .ps-headline {
      font-size: 18px;
      margin: 0 0 6px;
    }

    .ps-body {
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 12px;
    }

    .ps-cta {
      display: block;
      width: 100%;
      text-align: center;
      padding: 12px 16px;
      font-size: 14px;
    }

    .ps-image {
      margin: 0 auto 12px;
    }
  }

  /* ── New block base styles ──────────────────────────────────── */

  .ps-divider {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 16px 0;
  }

  .ps-spacer {
    height: 32px;
  }

  .ps-button-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ps-row {
    display: flex;
    gap: 16px;
    width: 100%;
    flex-wrap: wrap;
  }

  .ps-column {
    flex: 1;
    min-height: 50px;
  }

  /* ── Mobile: stack columns ─────────────────────────────────── */

  @media (max-width: 480px) {
    .ps-row {
      flex-direction: column;
    }
  }
`;

// ── Custom RTE actions (font style, font color) ──────────────────────

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'Courier', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: '"Trebuchet MS", sans-serif' },
];

const FONT_SIZES = [
  { label: '12', value: '1' },
  { label: '14', value: '2' },
  { label: '16', value: '3' },
  { label: '18', value: '4' },
  { label: '24', value: '5' },
  { label: '32', value: '6' },
  { label: '48', value: '7' },
];

const PRESET_COLORS = [
  '#111827', '#374151', '#6b7280', '#9ca3af',
  '#dc2626', '#ea580c', '#d97706', '#65a30d',
  '#059669', '#0891b2', '#2563eb', '#7c3aed',
  '#c026d3', '#e11d48', '#ffffff', '#000000',
];

function createDropdownAction(
  name: string,
  iconHtml: string,
  options: { label: string; value: string }[],
  onSelect: (value: string, doc: Document) => void,
): { name: string; icon: HTMLElement; result: () => void; update: () => number } {
  const wrapper = document.createElement('span');
  wrapper.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

  const btn = document.createElement('span');
  btn.innerHTML = iconHtml;
  btn.style.cssText = 'display:flex;align-items:center;justify-content:center;cursor:pointer;';
  wrapper.appendChild(btn);

  const dropdown = document.createElement('div');
  dropdown.style.cssText = 'display:none;position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;background:#fff;border:1px solid #e5e7eb;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;min-width:120px;max-height:200px;overflow-y:auto;padding:4px;';

  for (const opt of options) {
    const item = document.createElement('div');
    item.textContent = opt.label;
    item.style.cssText = 'padding:4px 8px;font-size:12px;cursor:pointer;border-radius:4px;color:#374151;white-space:nowrap;';
    if (name === 'fontFamily') {
      item.style.fontFamily = opt.value;
    }
    item.addEventListener('mouseenter', () => { item.style.backgroundColor = '#f3f4f6'; });
    item.addEventListener('mouseleave', () => { item.style.backgroundColor = 'transparent'; });
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(opt.value, document);
      dropdown.style.display = 'none';
    });
    dropdown.appendChild(item);
  }
  wrapper.appendChild(dropdown);

  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = dropdown.style.display !== 'none';
    dropdown.style.display = isOpen ? 'none' : 'block';
  });

  // Close dropdown on outside click
  document.addEventListener('mousedown', (e) => {
    if (!wrapper.contains(e.target as Node)) {
      dropdown.style.display = 'none';
    }
  });

  return {
    name,
    icon: wrapper,
    result: () => {},
    update: () => 0,
  };
}

function registerRteActions(editor: Editor) {
  const rte = editor.RichTextEditor;

  // Font Family dropdown
  const fontFamilyAction = createDropdownAction(
    'fontFamily',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16M6 16l6-12 6 12M8.5 12h7"/></svg>',
    FONT_FAMILIES,
    (value) => {
      editor.getModel().get('Canvas')?.getDocument()?.execCommand('fontName', false, value);
    },
  );
  rte.add('fontFamily', fontFamilyAction);

  // Font Size dropdown
  const fontSizeAction = createDropdownAction(
    'fontSize',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h8M4 16l4-10 4 10"/><path d="M14 20h8M16 16l4-8 4 8"/></svg>',
    FONT_SIZES,
    (value) => {
      editor.getModel().get('Canvas')?.getDocument()?.execCommand('fontSize', false, value);
    },
  );
  rte.add('fontSize', fontSizeAction);

  // Font Color picker
  const colorWrapper = document.createElement('span');
  colorWrapper.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

  const colorBtn = document.createElement('span');
  colorBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/></svg>';
  colorBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;cursor:pointer;';

  const colorIndicator = document.createElement('span');
  colorIndicator.style.cssText = 'position:absolute;bottom:1px;left:50%;transform:translateX(-50%);width:10px;height:2px;background:#111827;border-radius:1px;';
  colorBtn.appendChild(colorIndicator);
  colorWrapper.appendChild(colorBtn);

  const colorDropdown = document.createElement('div');
  colorDropdown.style.cssText = 'display:none;position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;padding:8px;width:160px;';

  // Preset color grid
  const colorGrid = document.createElement('div');
  colorGrid.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:3px;margin-bottom:6px;';

  for (const color of PRESET_COLORS) {
    const swatch = document.createElement('div');
    swatch.style.cssText = `width:14px;height:14px;border-radius:3px;cursor:pointer;background:${color};border:1px solid ${color === '#ffffff' ? '#d1d5db' : 'transparent'};transition:transform 0.1s;`;
    swatch.addEventListener('mouseenter', () => { swatch.style.transform = 'scale(1.25)'; });
    swatch.addEventListener('mouseleave', () => { swatch.style.transform = 'scale(1)'; });
    swatch.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      editor.getModel().get('Canvas')?.getDocument()?.execCommand('foreColor', false, color);
      colorIndicator.style.background = color;
      colorDropdown.style.display = 'none';
    });
    colorGrid.appendChild(swatch);
  }
  colorDropdown.appendChild(colorGrid);

  // Custom color input
  const customRow = document.createElement('div');
  customRow.style.cssText = 'display:flex;align-items:center;gap:4px;border-top:1px solid #e5e7eb;padding-top:6px;';

  const customInput = document.createElement('input');
  customInput.type = 'color';
  customInput.value = '#111827';
  customInput.style.cssText = 'width:22px;height:22px;border:1px solid #d1d5db;border-radius:4px;cursor:pointer;padding:0;background:none;';

  const customLabel = document.createElement('span');
  customLabel.textContent = 'Custom';
  customLabel.style.cssText = 'font-size:11px;color:#6b7280;';

  customInput.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    editor.getModel().get('Canvas')?.getDocument()?.execCommand('foreColor', false, val);
    colorIndicator.style.background = val;
  });
  customInput.addEventListener('mousedown', (e) => e.stopPropagation());

  customRow.appendChild(customInput);
  customRow.appendChild(customLabel);
  colorDropdown.appendChild(customRow);

  colorWrapper.appendChild(colorDropdown);

  colorBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = colorDropdown.style.display !== 'none';
    colorDropdown.style.display = isOpen ? 'none' : 'block';
  });

  document.addEventListener('mousedown', (e) => {
    if (!colorWrapper.contains(e.target as Node)) {
      colorDropdown.style.display = 'none';
    }
  });

  rte.add('fontColor', {
    name: 'fontColor',
    icon: colorWrapper,
    result: () => {},
    update: () => 0,
  });

  // ── Link insert/edit ──────────────────────────────────────────────

  const linkWrapper = document.createElement('span');
  linkWrapper.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

  const linkBtn = document.createElement('span');
  linkBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>';
  linkBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;cursor:pointer;';
  linkWrapper.appendChild(linkBtn);

  const linkPopover = document.createElement('div');
  linkPopover.style.cssText = 'display:none;position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:100;padding:8px;width:260px;';

  const linkLabel = document.createElement('div');
  linkLabel.textContent = 'Link URL';
  linkLabel.style.cssText = 'font-size:11px;font-weight:500;color:#374151;margin-bottom:4px;';
  linkPopover.appendChild(linkLabel);

  const linkInputRow = document.createElement('div');
  linkInputRow.style.cssText = 'display:flex;gap:4px;';

  const linkInput = document.createElement('input');
  linkInput.type = 'url';
  linkInput.placeholder = 'https://example.com';
  linkInput.style.cssText = 'flex:1;padding:5px 8px;font-size:12px;border:1px solid #d1d5db;border-radius:5px;outline:none;color:#374151;background:#f9fafb;';
  linkInput.addEventListener('focus', () => { linkInput.style.borderColor = '#6366f1'; });
  linkInput.addEventListener('blur', () => { linkInput.style.borderColor = '#d1d5db'; });
  linkInput.addEventListener('mousedown', (e) => e.stopPropagation());
  linkInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      applyLink();
    }
  });

  const linkApplyBtn = document.createElement('button');
  linkApplyBtn.textContent = 'Apply';
  linkApplyBtn.style.cssText = 'padding:5px 10px;font-size:11px;font-weight:500;background:#6366f1;color:#fff;border:none;border-radius:5px;cursor:pointer;white-space:nowrap;';
  linkApplyBtn.addEventListener('mouseenter', () => { linkApplyBtn.style.background = '#4f46e5'; });
  linkApplyBtn.addEventListener('mouseleave', () => { linkApplyBtn.style.background = '#6366f1'; });
  linkApplyBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyLink();
  });

  linkInputRow.appendChild(linkInput);
  linkInputRow.appendChild(linkApplyBtn);
  linkPopover.appendChild(linkInputRow);

  // Unlink button row
  const unlinkRow = document.createElement('div');
  unlinkRow.style.cssText = 'margin-top:6px;border-top:1px solid #e5e7eb;padding-top:6px;';

  const unlinkBtn = document.createElement('button');
  unlinkBtn.textContent = 'Remove link';
  unlinkBtn.style.cssText = 'font-size:11px;color:#dc2626;background:none;border:none;cursor:pointer;padding:0;';
  unlinkBtn.addEventListener('mouseenter', () => { unlinkBtn.style.textDecoration = 'underline'; });
  unlinkBtn.addEventListener('mouseleave', () => { unlinkBtn.style.textDecoration = 'none'; });
  unlinkBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    editor.getModel().get('Canvas')?.getDocument()?.execCommand('unlink', false);
    linkPopover.style.display = 'none';
  });

  unlinkRow.appendChild(unlinkBtn);
  linkPopover.appendChild(unlinkRow);
  linkWrapper.appendChild(linkPopover);

  function applyLink() {
    const url = linkInput.value.trim();
    if (!url) return;
    const canvasDoc = editor.getModel().get('Canvas')?.getDocument();
    if (canvasDoc) {
      canvasDoc.execCommand('createLink', false, url);
    }
    linkPopover.style.display = 'none';
  }

  linkBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = linkPopover.style.display !== 'none';
    if (!isOpen) {
      // Pre-fill with existing link if cursor is inside one
      const canvasDoc = editor.getModel().get('Canvas')?.getDocument();
      const sel = canvasDoc?.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node.nodeName !== 'A' && node.parentNode) {
          node = node.parentNode;
        }
        if (node && node.nodeName === 'A') {
          linkInput.value = (node as HTMLAnchorElement).href || '';
        } else {
          linkInput.value = '';
        }
      }
    }
    linkPopover.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) {
      setTimeout(() => linkInput.focus(), 50);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (!linkWrapper.contains(e.target as Node)) {
      linkPopover.style.display = 'none';
    }
  });

  rte.add('link', {
    name: 'link',
    icon: linkWrapper,
    result: () => {},
    state: (_rte, doc) => {
      // Highlight the link button when cursor is inside an <a> tag
      const sel = doc.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.anchorNode;
        while (node && node.nodeName !== 'A' && node.parentNode) {
          node = node.parentNode;
        }
        if (node && node.nodeName === 'A') return 1;
      }
      return 0;
    },
    update: () => 0,
  });
}

// ── Image edit overlay on hover ───────────────────────────────────────

function setupImageEditOverlay(editor: Editor) {
  const setupFrame = () => {
    const canvasDoc = editor.Canvas.getDocument();
    const canvasWin = editor.Canvas.getWindow();
    if (!canvasDoc || !canvasWin) return;

    // Skip if already injected
    if (canvasDoc.getElementById('ps-img-edit-style')) return;

    // Inject CSS
    const style = canvasDoc.createElement('style');
    style.id = 'ps-img-edit-style';
    style.textContent = `
      .ps-img-edit-btn {
        display: none;
        position: absolute;
        width: 26px;
        height: 26px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        cursor: pointer;
        z-index: 10;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        transition: background 0.15s;
      }
      .ps-img-edit-btn:hover { background: #eef2ff; }
      .ps-img-edit-btn svg { width: 14px; height: 14px; }
    `;
    canvasDoc.head.appendChild(style);

    // Create the floating edit button
    const btn = canvasDoc.createElement('div');
    btn.className = 'ps-img-edit-btn';
    btn.innerHTML = '<svg fill="none" stroke="#6366f1" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>';
    canvasDoc.body.appendChild(btn);

    let currentImg: HTMLElement | null = null;

    function positionBtn(img: HTMLElement) {
      const rect = img.getBoundingClientRect();
      btn.style.display = 'flex';
      btn.style.top = `${rect.top + canvasWin.scrollY + 6}px`;
      btn.style.left = `${rect.right + canvasWin.scrollX - 34}px`;
      currentImg = img;
    }

    function hideBtn() {
      btn.style.display = 'none';
      currentImg = null;
    }

    canvasDoc.body.addEventListener('mouseover', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        positionBtn(target);
      }
    });

    canvasDoc.body.addEventListener('mouseout', (e: Event) => {
      const me = e as MouseEvent;
      const target = me.target as HTMLElement;
      const related = me.relatedTarget as HTMLElement | null;
      if (target.tagName === 'IMG' && related !== btn && !btn.contains(related)) {
        hideBtn();
      }
    });

    btn.addEventListener('mouseout', (e: Event) => {
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
      if (related !== currentImg) {
        hideBtn();
      }
    });

    btn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (!currentImg) return;
      // Find the GrapesJS component for this img element
      const wrapper = editor.getWrapper();
      if (wrapper) {
        const allImages = wrapper.findType('image');
        const match = allImages.find((c) => c.getEl() === currentImg);
        if (match) {
          editor.select(match);
        }
      }
      // Open the custom asset picker (intercepted via asset:open handler)
      editor.AssetManager.open();
      hideBtn();
    });
  };

  // Set up on initial load and on any subsequent frame loads
  editor.on('canvas:frame:load', setupFrame);
  // Also try immediately in case the frame is already loaded
  setTimeout(setupFrame, 100);
}

// ── Custom component types ────────────────────────────────────────────

function registerCustomComponentTypes(editor: Editor) {
  editor.DomComponents.addType('ps-layer-group', {
    model: {
      defaults: {
        tagName: 'div',
        name: 'Layer Group',
        droppable: true,
        style: {
          position: 'relative',
          width: '100%',
          'min-height': '200px',
          overflow: 'hidden',
        },
        attributes: { class: 'ps-layer-group' },
      },
      init() {
        this.on('change:components', () => {
          for (const child of this.components().models) {
            const pos = child.getStyle()['position'];
            if (!pos || pos === 'static') {
              child.addStyle({
                position: 'absolute',
                top: '0',
                left: '0',
              });
            }
          }
        });
      },
    },
  });

  // Row — flex container for columns
  editor.DomComponents.addType('ps-row', {
    isComponent: (el) => el?.classList?.contains('ps-row'),
    model: {
      defaults: {
        tagName: 'div',
        name: 'Row',
        droppable: true,
        attributes: { class: 'ps-row' },
      },
    },
  });

  // Column — flex child inside a row
  editor.DomComponents.addType('ps-column', {
    isComponent: (el) => el?.classList?.contains('ps-column'),
    model: {
      defaults: {
        tagName: 'div',
        name: 'Column',
        droppable: true,
        attributes: { class: 'ps-column' },
      },
    },
  });
}

// ── Custom blocks registration ───────────────────────────────────────

function registerCustomBlocks(editor: Editor) {
  const bm = editor.BlockManager;

  bm.add('ps-image', {
    label: 'Image',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    content: {
      type: 'image',
      attributes: { class: 'ps-image', alt: 'Hero image' },
    },
  });

  bm.add('ps-headline', {
    label: 'Headline',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h10"/></svg>',
    content: '<h2 class="ps-headline">Your headline here</h2>',
  });

  bm.add('ps-body', {
    label: 'Body Text',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 10h16M4 14h12M4 18h8"/></svg>',
    content: '<p class="ps-body">Body text goes here. Edit to customize your message.</p>',
  });

  bm.add('ps-cta', {
    label: 'CTA Button',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h8"/></svg>',
    content: '<a href="#" class="ps-cta">Shop Now</a>',
  });

  // ── Additional content blocks ────────────────────────────────

}

// ── Component ────────────────────────────────────────────────────────

interface GrapesJSCanvasProps {
  content: VariantContent;
  onUpdate: (gjsData: { gjsProjectData: Record<string, unknown>; gjsHtml: string; gjsCss: string }) => void;
  /** Unique key to force remount when spot/variant changes */
  editorKey: string;
  device?: string;
  /** Whether to show the layer panel sidebar */
  showLayers?: boolean;
  /** Whether to show the style manager panel sidebar */
  showStyles?: boolean;
}

export default function GrapesJSCanvas({ content, onUpdate, editorKey, device, showLayers, showStyles }: GrapesJSCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const isLoadingRef = useRef(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  // Track device changes and update the editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !device) return;
    const deviceMap: Record<string, string> = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };
    editor.setDevice(deviceMap[device] || 'Desktop');
  }, [device]);

  // Reactively update editor when content changes externally (e.g., from AI skill output).
  // Skips if gjsProjectData exists (user has edited in GrapesJS — editor owns content).
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || isLoadingRef.current) return;
    if (content.gjsProjectData) return;
    const html = flatFieldsToGjsHtml(content);
    if (html) {
      isLoadingRef.current = true;
      editor.setComponents(html);
      setTimeout(() => { isLoadingRef.current = false; }, 200);
    }
  }, [content.headline, content.body, content.ctaText, content.imageUrl, content.deepLinkUrl]);

  const onEditorInit = useCallback((editor: Editor) => {
    editorRef.current = editor;
    registerCustomComponentTypes(editor);
    registerCustomBlocks(editor);
    registerRteActions(editor);
    setupImageEditOverlay(editor);

    // Pre-load user's asset library into GrapesJS Asset Manager
    const am = editor.AssetManager;
    const userAssets = loadAssetLibrary();
    am.add(userAssets.map((a) => ({ src: a.url, name: a.name, type: 'image' as const })));

    // Intercept the built-in asset manager to show our custom modal instead
    editor.on('asset:open', () => {
      editor.AssetManager.close();
      setShowAssetPicker(true);
    });

    // Load content: prefer gjsProjectData, then gjsHtml, then flat fields
    isLoadingRef.current = true;
    if (content.gjsProjectData) {
      editor.loadProjectData(content.gjsProjectData as ProjectData);
    } else if (content.gjsHtml) {
      // Load from patched HTML (preserves all elements with updated ps-* text)
      editor.setComponents(content.gjsHtml);
      if (content.gjsCss) {
        editor.setStyle(content.gjsCss);
      }
    } else {
      const html = flatFieldsToGjsHtml(content);
      if (html) {
        editor.setComponents(html);
      }
    }

    // Allow the load to complete before listening for changes
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 200);

    // Signal that editor is ready so LayerPanel can render
    setEditorReady(true);
  }, [content]);

  const handleUpdate = useCallback((projectData: ProjectData, editor: Editor) => {
    if (isLoadingRef.current) return;
    const html = editor.getHtml();
    const css = editor.getCss() || '';
    onUpdate({
      gjsProjectData: projectData as Record<string, unknown>,
      gjsHtml: html,
      gjsCss: css,
    });
  }, [onUpdate]);

  const handleAssetSelect = useCallback((url: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Get the currently selected component (the image being edited)
    const selected = editor.getSelected();
    if (selected && selected.is('image')) {
      selected.set('src', url);
      selected.addAttributes({ src: url });
    } else {
      // No image selected — add a new image component to the canvas
      editor.addComponents({
        type: 'image',
        attributes: { src: url, alt: 'Image', class: 'ps-image' },
      });
    }

    setShowAssetPicker(false);
  }, []);

  const handleAssetPickerClose = useCallback(() => {
    setShowAssetPicker(false);
  }, []);

  return (
    <div className="gjs-canvas-wrapper h-full" key={editorKey}>
      <GjsEditor
        grapesjs={grapesjs}
        options={{
          height: '100%',
          width: '100%',
          storageManager: false,
          cssIcons: '',
          panels: { defaults: [] },
          canvas: {
            styles: [],
          },
          assetManager: {
            // Assets loaded dynamically from user's library in onEditorInit
            assets: [],
          },
          deviceManager: {
            devices: [
              { name: 'Desktop', width: '' },
              { name: 'Tablet', width: '768px' },
              { name: 'Mobile', width: '375px' },
            ],
          },
          layerManager: {
            sortable: true,
            hidable: true,
            showWrapper: false,
          },
          styleManager: {
            sectors: [
              {
                name: 'Spacing',
                properties: ['padding', 'margin'],
              },
              {
                name: 'Typography',
                properties: [
                  'font-family', 'font-size', 'font-weight',
                  'line-height', 'letter-spacing', 'text-align', 'color',
                ],
              },
              {
                name: 'Background',
                properties: [
                  'background-color', 'background-image',
                  'background-size', 'background-position', 'background-repeat',
                ],
              },
              {
                name: 'Borders',
                properties: ['border', 'border-radius', 'box-shadow'],
              },
              {
                name: 'Effects',
                properties: ['opacity'],
              },
            ],
          },
          style: RESPONSIVE_BASE_CSS,
        }}
        onEditor={onEditorInit}
        onUpdate={handleUpdate}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0 flex flex-row">
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex-1 min-h-0">
                <Canvas
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
              <BlockPalette />
            </div>
            {showLayers && editorReady && editorRef.current && (
              <LayerPanel editor={editorRef.current} />
            )}
            {showStyles && editorReady && editorRef.current && (
              <StylePanel editor={editorRef.current} />
            )}
          </div>
        </div>
      </GjsEditor>

      {/* Custom asset picker modal (rendered outside GjsEditor to avoid z-index issues) */}
      {showAssetPicker && (
        <AssetPickerModal
          onSelect={handleAssetSelect}
          onClose={handleAssetPickerClose}
        />
      )}
    </div>
  );
}

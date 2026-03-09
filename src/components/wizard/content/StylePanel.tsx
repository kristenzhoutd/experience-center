/**
 * StylePanel — renders the GrapesJS Style Manager in a right sidebar panel.
 *
 * Follows the same layout pattern as LayerPanel.tsx. Uses
 * editor.StyleManager.render() to mount the built-in Style Manager UI
 * into a ref container.
 */

import { useEffect, useRef } from 'react';
import type { Editor } from 'grapesjs';

interface StylePanelProps {
  editor: Editor;
}

export default function StylePanel({ editor }: StylePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Render the GrapesJS Style Manager into our container
    const smEl = editor.StyleManager.render();
    el.appendChild(smEl);

    return () => {
      // Clean up: remove the rendered element on unmount
      if (smEl.parentNode === el) {
        el.removeChild(smEl);
      }
    };
  }, [editor]);

  return (
    <div className="w-56 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Styles</span>
      </div>
      <div ref={containerRef} className="gjs-sm-container" />
    </div>
  );
}

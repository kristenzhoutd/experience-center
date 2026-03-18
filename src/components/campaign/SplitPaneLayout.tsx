import { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { MessageSquare } from 'lucide-react';

interface SplitPaneLayoutProps {
  children: [ReactNode, ReactNode];
  initialLeftWidth?: number; // percentage 0-100
  minLeftWidth?: number;     // pixels
  maxLeftPercent?: number;   // percentage 0-100
  collapsed?: boolean;       // collapse left panel
  onToggleCollapse?: () => void;
}

export default function SplitPaneLayout({
  children,
  initialLeftWidth = 33,
  minLeftWidth = 280,
  maxLeftPercent = 60,
  collapsed = false,
  onToggleCollapse,
}: SplitPaneLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidthPercent, setLeftWidthPercent] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newLeftPx = e.clientX - rect.left;
      const containerWidth = rect.width;
      let newPercent = (newLeftPx / containerWidth) * 100;

      // Enforce min/max constraints
      const minPercent = (minLeftWidth / containerWidth) * 100;
      const minRightWidth = 400;
      const maxPercentFromRight = ((containerWidth - minRightWidth) / containerWidth) * 100;

      newPercent = Math.max(minPercent, Math.min(maxLeftPercent, maxPercentFromRight, newPercent));
      setLeftWidthPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftPercent]);

  return (
    <div
      ref={containerRef}
      className="flex flex-row flex-1 h-full overflow-hidden"
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* Left Panel */}
      <div
        className="h-full overflow-hidden flex flex-col transition-all duration-300"
        style={collapsed
          ? { width: 0, minWidth: 0, opacity: 0, pointerEvents: 'none' }
          : { width: `${leftWidthPercent}%`, minWidth: `${minLeftWidth}px` }
        }
      >
        {children[0]}
      </div>

      {/* Resizer */}
      {!collapsed && (
        <div className="flex items-center shrink-0 relative z-[5] mr-2">
          <div
            onMouseDown={handleMouseDown}
            className="w-[6px] h-full cursor-col-resize flex items-center justify-center group"
          >
            <div
              className={`w-1 rounded-sm transition-all duration-200 group-hover:bg-black group-hover:h-16 ${
                isDragging ? 'bg-black h-16' : 'bg-[#DCE1EA] h-10'
              }`}
            />
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div className="flex-1 min-w-[400px] h-full overflow-hidden flex flex-col relative">
        {/* Chat open button (top-left, shown when collapsed) */}
        {collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-6 left-6 w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer z-10"
            title="Open chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-gray-700" />
          </button>
        )}
        {children[1]}
      </div>
    </div>
  );
}

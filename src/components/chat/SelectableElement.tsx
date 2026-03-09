import { useEffect, useCallback } from 'react';
import { useChatPointerStore } from '../../stores/chatPointerStore';
import type { ElementReferenceType, ElementReferenceContext } from '../../types/elementReference';

interface SelectableElementProps {
  refId: string;
  refType: ElementReferenceType;
  path: string[];
  label: string;
  context: ElementReferenceContext;
  currentValue?: string;
  children: React.ReactNode;
}

export default function SelectableElement({
  refId,
  refType,
  path,
  label,
  context,
  currentValue,
  children,
}: SelectableElementProps) {
  const isSelectionMode = useChatPointerStore((s) => s.isSelectionMode);
  const references = useChatPointerStore((s) => s.references);
  const addReference = useChatPointerStore((s) => s.addReference);
  const removeReference = useChatPointerStore((s) => s.removeReference);
  const toggleSelectionMode = useChatPointerStore((s) => s.toggleSelectionMode);

  const isReferenced = references.some((r) => r.id === refId);

  // Escape key exits selection mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        toggleSelectionMode();
      }
    },
    [isSelectionMode, toggleSelectionMode],
  );

  useEffect(() => {
    if (isSelectionMode) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelectionMode, handleKeyDown]);

  // When not in selection mode, render children unchanged
  if (!isSelectionMode) return <>{children}</>;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isReferenced) {
      removeReference(refId);
    } else {
      addReference({
        id: refId,
        type: refType,
        path,
        label,
        currentValue,
        context,
      });
    }
  };

  return (
    <div
      className={`relative cursor-pointer rounded-lg transition-all ${
        isReferenced
          ? 'ring-2 ring-blue-500 bg-blue-50/30'
          : 'ring-2 ring-transparent hover:ring-blue-400 hover:bg-blue-50/20'
      }`}
      onClick={handleClick}
    >
      {/* Disable pointer events on children so clicks hit the wrapper */}
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
}

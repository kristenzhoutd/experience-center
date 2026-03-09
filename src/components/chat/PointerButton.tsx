import { MousePointer2 } from 'lucide-react';
import { useChatPointerStore } from '../../stores/chatPointerStore';

export default function PointerButton() {
  const isSelectionMode = useChatPointerStore((s) => s.isSelectionMode);
  const toggleSelectionMode = useChatPointerStore((s) => s.toggleSelectionMode);

  return (
    <button
      onClick={toggleSelectionMode}
      className={`w-8 h-8 flex items-center justify-center rounded-full border cursor-pointer transition-colors ${
        isSelectionMode
          ? 'bg-blue-50 text-blue-600 border-blue-200'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-gray-200'
      }`}
      title={isSelectionMode ? 'Exit selection mode (Esc)' : 'Select an element to reference'}
    >
      <MousePointer2 className="w-4 h-4" />
    </button>
  );
}

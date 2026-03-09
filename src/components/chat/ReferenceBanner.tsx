import { MousePointer2, X } from 'lucide-react';
import { useChatPointerStore } from '../../stores/chatPointerStore';

export default function ReferenceBanner() {
  const references = useChatPointerStore((s) => s.references);
  const removeReference = useChatPointerStore((s) => s.removeReference);
  const clearReferences = useChatPointerStore((s) => s.clearReferences);

  if (references.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
      {references.map((ref) => (
        <div
          key={ref.id}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700"
        >
          <MousePointer2 className="w-3 h-3 flex-shrink-0" />
          <span className="max-w-[200px] truncate">{ref.path.join(' > ')}</span>
          <button
            onClick={() => removeReference(ref.id)}
            className="text-blue-400 hover:text-blue-600 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {references.length > 1 && (
        <button
          onClick={clearReferences}
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
        >
          Clear All
        </button>
      )}
    </div>
  );
}

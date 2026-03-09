interface AutosaveIndicatorProps {
  isDirty: boolean;
  lastSavedAt: string | null;
}

export default function AutosaveIndicator({ isDirty, lastSavedAt }: AutosaveIndicatorProps) {
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Saving...
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Saved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Unsaved
    </span>
  );
}

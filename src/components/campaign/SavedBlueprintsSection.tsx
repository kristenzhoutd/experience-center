/**
 * SavedBlueprintsSection -- Displays saved campaign blueprints in a 4-column grid.
 * Converted from Emotion CSS to Tailwind. Uses useBlueprintStore (Zustand)
 * instead of blueprintService. react-router-dom for navigation.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { Blueprint } from '../../../electron/utils/ipc-types';
import { formatMessaging } from '../../utils/messagingHelpers';

// ---- CompactBlueprintCard ----

interface CompactBlueprintCardProps {
  blueprint: Blueprint;
  onSelect: (blueprint: Blueprint) => void;
  onDelete: (blueprint: Blueprint) => void;
}

function CompactBlueprintCard({ blueprint, onSelect, onDelete }: CompactBlueprintCardProps) {
  const confidenceColor =
    blueprint.confidence === 'High'
      ? 'bg-green-100 text-green-700'
      : blueprint.confidence === 'Medium'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';

  const variantColor =
    blueprint.variant === 'aggressive'
      ? 'bg-red-50 text-red-600'
      : blueprint.variant === 'balanced'
      ? 'bg-blue-50 text-blue-600'
      : 'bg-green-50 text-green-600';

  return (
    <div
      onClick={() => onSelect(blueprint)}
      className="group relative bg-white rounded-xl border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-md"
    >
      {/* Delete button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(blueprint);
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
        title="Delete blueprint"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* Blueprint name */}
      <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate pr-6">
        {blueprint.name}
      </h4>

      {/* Description / messaging preview */}
      <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
        {formatMessaging(blueprint.messaging) || 'No description available'}
      </p>

      {/* Inner blueprint card with light blue bg */}
      <div className="bg-blue-50/60 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Confidence badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceColor}`}
          >
            {blueprint.confidence} Confidence
          </span>
          {/* Variant badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${variantColor}`}
          >
            {blueprint.variant}
          </span>
        </div>

        {/* Channels */}
        {blueprint.channels && blueprint.channels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {blueprint.channels.slice(0, 3).map((ch, idx) => {
              // Handle both string and object channel formats
              const channelName = typeof ch === 'string' ? ch : (ch as any)?.name || String(ch);
              return (
                <span
                  key={`${channelName}-${idx}`}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/80 text-gray-600 border border-gray-200/60"
                >
                  {channelName}
                </span>
              );
            })}
            {blueprint.channels.length > 3 && (
              <span className="text-[10px] text-gray-400">
                +{blueprint.channels.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Budget */}
        {blueprint.budget && (
          <div className="text-[11px] text-gray-500">
            Budget: <span className="font-medium text-gray-700">{blueprint.budget.amount}</span>
            {blueprint.budget.pacing && (
              <span className="text-gray-400"> &middot; {blueprint.budget.pacing}</span>
            )}
          </div>
        )}
      </div>

      {/* Metrics grid */}
      {blueprint.metrics && (
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-1.5 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 mb-0.5">Reach</div>
            <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.reach}</div>
          </div>
          <div className="text-center p-1.5 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 mb-0.5">CTR</div>
            <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.ctr}</div>
          </div>
          <div className="text-center p-1.5 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 mb-0.5">ROAS</div>
            <div className="text-xs font-semibold text-gray-800">{blueprint.metrics.roas}</div>
          </div>
          <div className="text-center p-1.5 bg-gray-50 rounded-lg">
            <div className="text-[10px] text-gray-400 mb-0.5">Conversions</div>
            <div className="text-xs font-semibold text-gray-800">
              {blueprint.metrics.conversions}
            </div>
          </div>
        </div>
      )}

      {/* Created date */}
      <div className="mt-3 text-[10px] text-gray-400">
        {new Date(blueprint.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>
    </div>
  );
}

// ---- Delete Confirmation Modal ----

interface DeleteModalProps {
  blueprint: Blueprint;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ blueprint, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Delete Blueprint</h3>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">"{blueprint.name}"</span>? This action
          cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- SavedBlueprintsSection ----

export default function SavedBlueprintsSection() {
  const navigate = useNavigate();
  const { blueprints, loadBlueprints, deleteBlueprint } = useBlueprintStore();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [blueprintToDelete, setBlueprintToDelete] = useState<Blueprint | null>(null);

  useEffect(() => {
    loadBlueprints();
  }, [loadBlueprints]);

  const handleSelectBlueprint = (blueprint: Blueprint) => {
    // Navigate to campaign chat with the blueprint loaded
    navigate(`/campaign-chat?blueprintId=${blueprint.id}`);
  };

  const handleDeleteBlueprint = (blueprint: Blueprint) => {
    setBlueprintToDelete(blueprint);
  };

  const confirmDelete = () => {
    if (blueprintToDelete) {
      deleteBlueprint(blueprintToDelete.id);
      setBlueprintToDelete(null);
    }
  };

  if (blueprints.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-10">
      {/* Delete Confirmation Modal */}
      {blueprintToDelete && (
        <DeleteConfirmationModal
          blueprint={blueprintToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setBlueprintToDelete(null)}
        />
      )}

      {/* Collapsible header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 mb-4 group cursor-pointer bg-transparent border-none p-0"
      >
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
          Recent Campaign Blueprints
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {blueprints.length}
        </span>
      </button>

      {/* Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {blueprints
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .map((blueprint) => (
              <CompactBlueprintCard
                key={blueprint.id}
                blueprint={blueprint}
                onSelect={handleSelectBlueprint}
                onDelete={handleDeleteBlueprint}
              />
            ))}
        </div>
      )}
    </div>
  );
}

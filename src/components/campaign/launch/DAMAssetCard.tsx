/**
 * DAM Asset Card — Grid thumbnail card for the DAM browser.
 * Shows thumbnail, type badge, provider badge, usage rights dot, and hover overlay.
 */

import { Film, Image } from 'lucide-react';
import type { DAMAsset } from '../../../types/dam';

interface Props {
  asset: DAMAsset;
  isSelected: boolean;
  onSelect: (asset: DAMAsset) => void;
}

const typeIcons = {
  image: Image,
  video: Film,
} as const;

const rightsColors = {
  approved: 'bg-green-400',
  restricted: 'bg-yellow-400',
  pending: 'bg-gray-400',
} as const;

export default function DAMAssetCard({ asset, isSelected, onSelect }: Props) {
  const TypeIcon = typeIcons[asset.type];

  return (
    <button
      onClick={() => onSelect(asset)}
      className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-gray-100 p-0 text-left w-full aspect-square ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-transparent hover:border-gray-300'
      }`}
    >
      {/* Thumbnail */}
      <img
        src={asset.thumbnailUrl}
        alt={asset.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Type badge (top-right) */}
      <span className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium uppercase">
        <TypeIcon className="w-2.5 h-2.5" />
        {asset.type}
      </span>

      {/* Provider badge (bottom-left) */}
      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-black/60 text-white">
        {asset.provider}
      </span>

      {/* Usage rights dot (bottom-right) */}
      <span
        className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${rightsColors[asset.usageRights]} ring-1 ring-white/80`}
        title={`Rights: ${asset.usageRights}`}
      />

      {/* Hover overlay with name */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
        <span className="w-full px-2 py-1.5 text-[10px] font-medium text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
          {asset.name}
        </span>
      </div>
    </button>
  );
}

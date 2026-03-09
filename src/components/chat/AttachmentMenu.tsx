import { FileText, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AttachmentMenuProps {
  onUploadFile: () => void;
  onUploadImage: () => void;
  onSelectCampaign: () => void;
  onClose: () => void;
}

export default function AttachmentMenu({ onUploadFile, onUploadImage, onSelectCampaign, onClose }: AttachmentMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items = [
    { icon: FileText, label: 'Upload file', onClick: onUploadFile },
    { icon: ImageIcon, label: 'Upload image', onClick: onUploadImage },
    { icon: FolderOpen, label: 'Select campaign', onClick: onSelectCampaign },
  ];

  return (
    <div
      ref={ref}
      className="absolute bottom-[calc(100%+4px)] left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] z-50 overflow-hidden"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className="w-full px-4 py-2.5 border-none bg-transparent text-left text-sm text-gray-700 cursor-pointer transition-colors hover:bg-gray-50 flex items-center gap-2.5"
        >
          <item.icon className="w-4 h-4 text-gray-400" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

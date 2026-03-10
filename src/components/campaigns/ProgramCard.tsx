import { FolderKanban, Trash2 } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  description: string;
  startDate: string;
  status: 'active' | 'paused' | 'completed' | 'draft' | 'in-progress';
  stepsCompleted: number;
  totalSteps: number;
  platforms: string[];
}

interface ProgramCardProps {
  program: Program;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onClick, onEdit, onDelete }) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'active':
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-600';
      case 'draft':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const progressPercent = program.totalSteps > 0
    ? Math.round((program.stepsCompleted / program.totalSteps) * 100)
    : 0;

  const getStatusLabel = (status: string) => {
    if (status === 'in-progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div
      onClick={onClick}
      className="relative group bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
    >
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-7 h-7 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 border-none cursor-pointer"
            title="Delete program"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FolderKanban className="w-4 h-4 text-gray-500" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-xs text-gray-900">{program.name}</h3>
          <p className="text-[10px] text-gray-400">{program.description}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex gap-1.5 mb-3">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusClasses(program.status)}`}>
          {getStatusLabel(program.status)}
        </span>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-1.5 mb-3">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="#9CA3AF" strokeWidth="1.2"/>
          <path d="M2 6H14" stroke="#9CA3AF" strokeWidth="1.2"/>
          <path d="M5 1V4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M11 1V4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-[10px] text-gray-400">{program.startDate}</span>
      </div>

      {/* Step Progress */}
      <div className="mb-3">
        <div className="text-[10px] text-gray-500 mb-1">
          Step {program.stepsCompleted} of {program.totalSteps}
        </div>
        <div className="text-xs font-semibold text-gray-900 mb-2">
          {program.stepsCompleted}/{program.totalSteps} steps completed
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-3" />

      {/* Platform Badges */}
      <div className="flex gap-1.5 flex-wrap">
        {program.platforms.map((platform) => (
          <span key={platform} className="bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
            {platform}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProgramCard;

import { Segment, ContentVariant } from '../types/shared';

interface CampaignDraft {
  name?: string;
  description?: string;
  goal?: { type: string; description: string };
  segments?: Partial<Segment>[];
  contentAssignments?: Array<{
    contentSpotId: string;
    contentSpotName: string;
    variant: ContentVariant;
  }>;
}

interface Props {
  draft: CampaignDraft;
  onLaunch: () => void;
}

export default function CampaignDraftCard({ draft, onLaunch }: Props) {
  return (
    <div className="space-y-4">
      {/* Campaign Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {draft.name || 'Untitled Campaign'}
        </h4>
        {draft.description && (
          <p className="text-sm text-gray-600 mb-3">{draft.description}</p>
        )}
        {draft.goal && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-1 bg-primary-100 text-primary-700 rounded">
              {draft.goal.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500">{draft.goal.description}</span>
          </div>
        )}
      </div>

      {/* Segments */}
      {draft.segments && draft.segments.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Target Audiences</h5>
          <div className="space-y-2">
            {draft.segments.map((segment, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-sm text-gray-900">{segment.name}</div>
                {segment.description && (
                  <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
                )}
                {segment.rules && segment.rules.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {segment.rules.map((rule, ruleIdx) => (
                      <span
                        key={ruleIdx}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {rule.attribute} {rule.operator} {String(rule.value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Assignments */}
      {draft.contentAssignments && draft.contentAssignments.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Personalized Content</h5>
          <div className="space-y-2">
            {draft.contentAssignments.map((assignment, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-medium text-primary-600 mb-1">
                  {assignment.contentSpotName}
                </div>
                {assignment.variant.type === 'text' && (
                  <p className="text-sm text-gray-900">
                    "{(assignment.variant.content as any).text}"
                  </p>
                )}
                {assignment.variant.type === 'image' && (
                  <div className="text-sm text-gray-600">
                    Image: {(assignment.variant.content as any).alt}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Launch button */}
      <button
        onClick={onLaunch}
        className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
      >
        Launch Campaign
      </button>
    </div>
  );
}

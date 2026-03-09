/**
 * LaunchProgressModal — step-by-step progress overlay shown during
 * the sequential Meta campaign hierarchy push.
 */

import type { LaunchProgress } from '../../../types/campaignLaunch';
import { usePlatformStore } from '../../../stores/platformStore';

interface LaunchProgressModalProps {
  progress: LaunchProgress;
  onClose: () => void;
  onRetry?: () => void;
}

export default function LaunchProgressModal({ progress, onClose, onRetry }: LaunchProgressModalProps) {
  const isLaunching = progress.overallStatus === 'launching';
  const isSuccess = progress.overallStatus === 'success';
  const isPartial = progress.overallStatus === 'partial_success';
  const isError = progress.overallStatus === 'error';
  const isDone = isSuccess || isPartial || isError;

  const metaConn = usePlatformStore((s) => s.connections.find((c) => c.platform === 'meta'));
  const metaActId = metaConn?.accountId?.replace(/^act_/, '') || '';
  const metaBizId = metaConn?.businessId || '';
  const metaAdsManagerUrl = progress.campaignId
    ? metaActId
      ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?${metaBizId ? `global_scope_id=${metaBizId}&business_id=${metaBizId}&` : ''}act=${metaActId}&selected_campaign_ids=${progress.campaignId}`
      : `https://www.facebook.com/adsmanager/manage/campaigns?campaign_ids=${progress.campaignId}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 m-0">
            {isLaunching ? 'Launching Campaign...' : isSuccess ? 'Launch Complete' : isPartial ? 'Partially Launched' : 'Launch Failed'}
          </h3>
          {isDone && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="px-6 py-5 flex flex-col gap-1 overflow-y-auto">
          {progress.stepResults.map((step, idx) => (
            <div key={step.step} className="flex items-start gap-3 py-2.5">
              {/* Step icon */}
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                )}
                {step.status === 'in_progress' && (
                  <div className="w-5 h-5">
                    <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
                {step.status === 'success' && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {step.status === 'error' && (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {step.status === 'skipped' && (
                  <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  step.status === 'in_progress' ? 'text-blue-600' :
                  step.status === 'success' ? 'text-green-700' :
                  step.status === 'error' ? 'text-red-600' :
                  step.status === 'skipped' ? 'text-gray-400' :
                  'text-gray-500'
                }`}>
                  {step.label}
                  {step.status === 'skipped' && ' (skipped)'}
                </div>
                {step.error && (
                  <div className="text-xs text-red-500 mt-0.5">{step.error}</div>
                )}
                {step.createdIds && step.createdIds.length > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    Created: {step.createdIds.join(', ')}
                  </div>
                )}
                {step.step === 'activateAudience' && step.status === 'success' && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-3.5 h-3.5 rounded-sm bg-[#00B140] flex items-center justify-center flex-shrink-0">
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500">Audience synced to LiveRamp for enrichment</span>
                  </div>
                )}
              </div>

              {/* Connector line */}
              {idx < progress.stepResults.length - 1 && (
                <div className="absolute left-[30px] mt-6 w-px h-4 bg-gray-200" style={{ display: 'none' }} />
              )}
            </div>
          ))}

          {/* Summary card */}
          {isDone && (
            <div className={`mt-4 p-4 rounded-xl border ${
              isSuccess ? 'bg-green-50 border-green-200' :
              isPartial ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className={`text-sm font-semibold mb-1 ${
                isSuccess ? 'text-green-800' : isPartial ? 'text-amber-800' : 'text-red-800'
              }`}>
                {isSuccess ? 'All steps completed successfully!' :
                 isPartial ? 'Campaign created with some steps failing.' :
                 'Campaign creation failed.'}
              </div>
              {progress.campaignId && (
                <div className="text-xs text-gray-600">
                  Campaign ID: <span className="font-mono">{progress.campaignId}</span>
                </div>
              )}
              {Object.keys(progress.adSetIdMap).length > 0 && (
                <div className="text-xs text-gray-600 mt-0.5">
                  Ad Sets created: {Object.keys(progress.adSetIdMap).length}
                </div>
              )}
              {Object.keys(progress.creativeIdMap).length > 0 && (
                <div className="text-xs text-gray-600 mt-0.5">
                  Creatives created: {Object.keys(progress.creativeIdMap).length}
                </div>
              )}
              {Object.keys(progress.adIdMap).length > 0 && (
                <div className="text-xs text-gray-600 mt-0.5">
                  Ads created: {Object.keys(progress.adIdMap).length}
                </div>
              )}
              {progress.stepResults.find((s) => s.step === 'activateAudience' && s.status === 'success') && (
                <div className="text-xs text-gray-600 mt-0.5">
                  Audience activated via LiveRamp
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isDone && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {isPartial && onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2.5 bg-white border border-amber-300 rounded-lg text-sm font-medium text-amber-700 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                Retry Failed
              </button>
            )}
            {metaAdsManagerUrl && (
              <a
                href={metaAdsManagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors no-underline"
              >
                View in Ads Manager
              </a>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

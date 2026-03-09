import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useCampaignConfigStore } from '../stores/campaignConfigStore';
import { Button } from '@/design-system';
import WizardStepper from './wizard/WizardStepper';
import CampaignSetupStep from './wizard/CampaignSetupStep';
import AudiencesStep from './wizard/AudiencesStep';
import ContentStep from './wizard/ContentStep';
import ReviewStep from './wizard/ReviewStep';

interface CampaignConfigurationWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function CampaignConfigurationWizard({
  onComplete,
  onCancel,
}: CampaignConfigurationWizardProps) {
  const navigate = useNavigate();
  const currentStep = useCampaignConfigStore((s) => s.currentStep);
  const config = useCampaignConfigStore((s) => s.config);
  const isDirty = useCampaignConfigStore((s) => s.isDirty);
  const goToStep = useCampaignConfigStore((s) => s.goToStep);
  const goNext = useCampaignConfigStore((s) => s.goNext);
  const goPrev = useCampaignConfigStore((s) => s.goPrev);
  const saveAsDraft = useCampaignConfigStore((s) => s.saveAsDraft);
  const launch = useCampaignConfigStore((s) => s.launch);

  const [showSaved, setShowSaved] = useState(false);

  // Clear the saved indicator after a delay
  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [showSaved]);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading campaign configuration...</p>
        </div>
      </div>
    );
  }

  const handleSaveAsDraft = () => {
    saveAsDraft();
    setShowSaved(true);
  };

  const handleLaunch = () => {
    launch();
    onComplete();
  };

  const handleViewDashboard = () => {
    if (config?.id) {
      navigate(`/campaigns/${config.id}/analysis`);
    }
  };

  const isLaunched = config?.status === 'launched' || config?.status === 'ready';

  return (
    <div className="h-full flex flex-col bg-[#fafbfc]">
      {/* Stepper */}
      <WizardStepper currentStep={currentStep} onStepClick={goToStep} />

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {currentStep === 1 && <CampaignSetupStep />}
        {currentStep === 2 && <AudiencesStep />}
        {currentStep === 3 && <ContentStep />}
        {currentStep === 4 && <ReviewStep />}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveAsDraft}>
            Save Draft
          </Button>

          {/* Saved indicator */}
          {showSaved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 animate-fade-in">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {!showSaved && isDirty && (
            <span className="text-xs text-gray-400">Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back
            </Button>
          )}

          {currentStep < 4 ? (
            <Button variant="primary" size="sm" onClick={goNext}>
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          ) : (
            <>
              <Button variant="primary" onClick={handleLaunch}>
                Launch Campaign
              </Button>
              {isLaunched && (
                <Button
                  variant="outline"
                  onClick={handleViewDashboard}
                  icon={<BarChart3 className="w-4 h-4" />}
                >
                  View Dashboard
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
